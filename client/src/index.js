import * as React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { cacheExchange } from "@urql/exchange-graphcache";
import {
  createClient,
  dedupExchange,
  Provider,
  subscriptionExchange,
  gql,
  useQuery,
  fetchExchange,
  useMutation,
  useSubscription,
} from "urql";

const User = gql`
  query {
    user {
      id
      notifications
    }
  }
`;

const Increase = gql`
  mutation {
    increaseCounter
  }
`;

const Subscription = gql`
  subscription {
    userUpdate {
      increase
    }
  }
`;

const subscriptionClient = new SubscriptionClient(
  "ws://localhost:4000/graphql",
  {}
);

const client = createClient({
  url: "http://localhost:4000",
  exchanges: [
    dedupExchange,
    cacheExchange({
      updates: {
        Subscription: {
          userUpdate: (data, args, cache) => {
            cache.updateQuery(
              {
                query: User,
              },
              (cachedData) => {
                if (!cachedData?.user) return data;
                cachedData.user.notifications += data.userUpdate.increase
                  ? 1
                  : -1;
                return cachedData;
              }
            );
          },
        },
      },
    }),
    fetchExchange,
    subscriptionExchange({
      forwardSubscription: (operation) => subscriptionClient.request(operation),
    }),
  ],
});

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

const App = () => {
  const [{ data }] = useQuery({ query: User });
  const [, increase] = useMutation(Increase);
  useSubscription({
    query: Subscription,
  });
  if (!data?.user) return null;

  return (
    <>
      <div>{`Unread notifications: ${data.user.notifications}`}</div>
      <button onClick={increase}>Create 5 notifications</button>
    </>
  );
};

root.render(
  <StrictMode>
    <Provider value={client}>
      <App />
    </Provider>
  </StrictMode>
);
