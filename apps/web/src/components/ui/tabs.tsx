'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const TabsContext = React.createContext<{
  value?: string
}>({})

const useTabsContext = () => {
  const context = React.useContext(TabsContext)
  if (context === undefined) {
    throw new Error('useTabsContext must be used within a TabsProvider')
  }
  return context
}

function Tabs({
  className,
  value: controlledValue,
  defaultValue,
  onValueChange,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const value = controlledValue ?? internalValue

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      setInternalValue(newValue)
      onValueChange?.(newValue)
    },
    [onValueChange],
  )

  return (
    <TabsContext.Provider value={{ value }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        className={cn('flex flex-col gap-2', className)}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        {...props}
      />
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  const { value } = useTabsContext()
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({
    opacity: 0,
  })
  const listRef = React.useRef<HTMLDivElement>(null)

  const updateIndicator = React.useCallback(() => {
    if (!listRef.current) return

    const activeTab = listRef.current.querySelector<HTMLElement>('[data-state="active"]')
    if (!activeTab) return

    const listRect = listRef.current.getBoundingClientRect()
    const tabRect = activeTab.getBoundingClientRect()

    setIndicatorStyle({
      left: `${tabRect.left - listRect.left}px`,
      top: `${tabRect.top - listRect.top}px`,
      width: `${tabRect.width}px`,
      height: `${tabRect.height}px`,
      opacity: 1,
    })
  }, [])

  React.useLayoutEffect(() => {
    updateIndicator()
  }, [value, updateIndicator])

  React.useEffect(() => {
    const resizeObserver = new ResizeObserver(updateIndicator)
    if (listRef.current) {
      resizeObserver.observe(listRef.current)
    }
    return () => resizeObserver.disconnect()
  }, [updateIndicator])

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn(
        'relative inline-flex h-auto w-fit flex-wrap items-center justify-center rounded-lg bg-muted text-muted-foreground p-0.75 text-text',
        className,
      )}
      {...props}
    >
      <div
        className="absolute rounded-md border border-transparent bg-background shadow-sm transition-[left,top,width,height,opacity] duration-200 ease-out dark:border-input dark:bg-input/30"
        style={indicatorStyle}
        aria-hidden="true"
      />
      {props.children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'relative z-10 inline-flex h-auto min-h-7.5 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-6 py-1 text-sm font-medium text-text-muted transition-colors',
        'hover:text-text',
        'focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:text-foreground ',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
