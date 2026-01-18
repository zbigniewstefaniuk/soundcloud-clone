import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools';

import type { QueryClient } from '@tanstack/react-query';
import Header from '@/components/common/header';
import { Toaster } from '@/components/ui/sonner';
import { PlayerProvider } from '@/contexts/player-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { MiniPlayer } from '@/components/player/mini-player';

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <ThemeProvider>
      <PlayerProvider>
        <Header />
        <div className="pb-24">
          <Outlet />
        </div>
        <MiniPlayer />
        <Toaster />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
      </PlayerProvider>
    </ThemeProvider>
  ),
});
