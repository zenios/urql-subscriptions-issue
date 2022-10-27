const { gql, PubSub } = require("apollo-server");

const pubsub = new PubSub();

const test_messages = 5;

exports.typeDefs = gql`
  type Query {
    user: User!
  }

  type Mutation {
    increaseCounter: Int!
  }

  type User {
    id: ID
    notifications: Int!
  }

  type Subscription {
    userUpdate: UpdateEvent!
  }

  type UpdateEvent {
    increase: Boolean!
  }
`;

exports.resolvers = {
  Query: {
    user: () => ({ id: "test", notifications: 0 }),
  },
  Mutation: {
    increaseCounter: () => {
      for (let i = 0; i < test_messages; i++)
        pubsub.publish("newNotifications", { userUpdate: { increase: true } });
      return test_messages;
    },
  },
  Subscription: {
    userUpdate: {
      subscribe: () => pubsub.asyncIterator("newNotifications"),
    },
  },
};
