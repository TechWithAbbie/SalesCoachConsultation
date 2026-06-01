import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// QueryClient must live outside getRouter so it's never recreated on re-renders.
// A new QueryClient on every call = new context = full tree remount = form hang.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable ALL automatic refetching — this is the #1 cause of form hangs.
      // Window focus refetch fires every time a user taps into an input on mobile.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: { queryClient },
    // scrollRestoration can trigger router activity on focus — disable it.
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
  });

  return router;
};