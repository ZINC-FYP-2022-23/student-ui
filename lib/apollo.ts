import { useMemo } from "react";
import { ApolloClient, HttpLink, InMemoryCache, NormalizedCacheObject, split } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { WebSocketLink } from "@apollo/client/link/ws";

let apolloClient: ApolloClient<NormalizedCacheObject>;
const isBrowser = typeof window !== "undefined";
const endpoint = "localhost:8080/v1/graphql";
// const endpoint = 'api.oap.ust.dev/v1/graphql';

function createApolloClient(cookie: string) {
  const httpLink = new HttpLink({
    uri: `http://${endpoint}`, // Server URL (must be absolute)
    credentials: "include", // Additional fetch() options like `credentials` or `headers`
    headers: {
      cookie,
    },
  });
  const wsLink = isBrowser
    ? new WebSocketLink({
        uri: `ws://${endpoint}`,
        options: {
          lazy: true,
          reconnect: true,
          connectionParams: {
            headers: {
              cookie,
            },
          },
        },
      })
    : null;

  const link =
    isBrowser && wsLink
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return definition.kind === "OperationDefinition" && definition.operation === "subscription";
          },
          wsLink,
          httpLink,
        )
      : httpLink;

  return new ApolloClient({
    ssrMode: !isBrowser,
    link,
    cache: new InMemoryCache(),
  });
}

export function initializeApollo(cookie: string, initialState: any = null) {
  const _apolloClient = apolloClient ?? createApolloClient(cookie);

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract();
    // Restore the cache using the data passed from getStaticProps/getServerSideProps
    // combined with the existing cached data
    _apolloClient.cache.restore({ ...existingCache, ...initialState });
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === "undefined") return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

export function useApollo(cookie, initialState) {
  const store = useMemo(() => initializeApollo(cookie, initialState), [initialState]);
  return store;
}
