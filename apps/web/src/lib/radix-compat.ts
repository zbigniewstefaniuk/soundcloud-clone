import type * as React from "react"

/**
 * Type compatibility layer for Radix UI primitives with React 19 + Bun.
 *
 * ## The Problem
 *
 * 1. **React 18 → 19 breaking changes**:
 *    - In React 18: refs were special-cased via `RefAttributes`
 *    - In React 19: refs are regular props in `ComponentPropsWithoutRef`
 *
 * 2. **Radix UI was built for React 18**:
 *    - Radix primitives use `ForwardRefExoticComponent` with React 18 assumptions
 *    - The `LabelProps` type from Radix doesn't include standard HTML attributes
 *
 * 3. **Bun exposes the conflict**:
 *    - npm flattens node_modules, merging conflicting @types/react versions
 *    - Bun maintains strict workspace isolation, exposing type incompatibilities
 *    - Result: `className`, `children`, etc. are not assignable to Radix components
 *
 * ## The Solution
 *
 * We bypass Radix's types entirely and build props from the underlying HTML element.
 * This gives us React 19-compatible types that include all standard HTML attributes.
 */

/**
 * Extract props from a Radix UI primitive, compatible with React 19.
 *
 * This type:
 * 1. Uses the underlying HTML element (label, button, etc.)
 * 2. Gets all native HTML props via React 19's `ComponentPropsWithoutRef`
 * 3. Adds Radix's `asChild` composition prop
 *
 * @example
 * ```tsx
 * import * as LabelPrimitive from "@radix-ui/react-label"
 * import type { RadixComponentProps } from "@/lib/radix-compat"
 *
 * // Define your component with proper React 19 types
 * const Label = React.forwardRef<
 *   HTMLLabelElement,
 *   RadixComponentProps<typeof LabelPrimitive.Root>
 * >(({ className, ...props }, ref) => (
 *   <LabelPrimitive.Root ref={ref} className={className} {...props} />
 * ))
 * ```
 */
export type RadixComponentProps<T extends React.ElementType> =
  React.ComponentPropsWithoutRef<
    T extends React.ForwardRefExoticComponent<{ ref?: React.Ref<infer E> }>
      ? E extends HTMLLabelElement ? "label"
      : E extends HTMLButtonElement ? "button"
      : E extends HTMLDivElement ? "div"
      : E extends HTMLInputElement ? "input"
      : E extends HTMLSelectElement ? "select"
      : E extends HTMLTextAreaElement ? "textarea"
      : E extends HTMLAnchorElement ? "a"
      : E extends HTMLSpanElement ? "span"
      : E extends HTMLFormElement ? "form"
      : E extends HTMLImageElement ? "img"
      : E extends HTMLUListElement ? "ul"
      : E extends HTMLOListElement ? "ol"
      : E extends HTMLLIElement ? "li"
      : E extends HTMLNavElement ? "nav"
      : E extends HTMLParagraphElement ? "p"
      : E extends HTMLHeadingElement ? "h2"
      : E extends SVGElement ? "svg"
      : "div"
      : "div"
  > & {
    /**
     * Radix UI's composition prop.
     * When true, merges props into the child instead of rendering a wrapper.
     */
    asChild?: boolean
  }
