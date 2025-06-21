import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
        // Reduce retry attempts to prevent cascade failures
        retry: (failureCount, error) => {
          // Don't retry on abort errors
          if (error && (error as any).name === 'AbortError') {
            return false;
          }
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        // Increase retry delay
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't refetch on window focus in development
        refetchOnWindowFocus: process.env.NODE_ENV !== 'development',
        // Don't refetch on reconnect in development
        refetchOnReconnect: process.env.NODE_ENV !== 'development',
      },
      mutations: {
        // Don't retry mutations by default
        retry: false,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
