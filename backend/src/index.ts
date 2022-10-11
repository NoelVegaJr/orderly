import { ApolloServer } from 'apollo-server-express';
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
} from 'apollo-server-core';
import express from 'express';
import http from 'http';
import typeDefs from './graphql/typeDefs';
import resolvers from './graphql/resolvers';
import { getSession } from 'next-auth/react';
import { GraphQLContext } from './types/types';
import { PrismaClient } from '@prisma/client';
import { Session } from './types/types';

console.log(resolvers);

async function main() {
  const app = express();
  const httpServer = http.createServer(app);

  const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
  };

  const prisma = new PrismaClient();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    cache: 'bounded',
    context: async ({ req }): Promise<GraphQLContext> => {
      const session = (await getSession({ req })) as Session;
      return { session, prisma };
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });
  await server.start();
  server.applyMiddleware({ app, cors: corsOptions, path: '/graphql' });
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4001 }, resolve)
  );
  console.log(`🚀 Server ready at http://localhost:4001${server.graphqlPath}`);
}

main().catch((error) => console.log(error));