'use client';

import { ApolloClient, InMemoryCache, split, ApolloLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { setContext } from '@apollo/client/link/context';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

const uploadHttp = createUploadLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
  headers: { 'GraphQL-Preflight': '1' },
}) as unknown as ApolloLink;

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('resq_jwt') : null;
  return { headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) } };
});

const httpLink = authLink.concat(uploadHttp);

const wsLink =
  typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL!, // e.g. ws://localhost:5239/graphql
          lazy: true,
          connectionParams: () => {
            const token = localStorage.getItem('resq_jwt');
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        })
      )
    : null;

const link =
  typeof window !== 'undefined' && wsLink
    ? split(
        ({ query }) => {
          const def = getMainDefinition(query);
          return def.kind === 'OperationDefinition' && def.operation === 'subscription';
        },
        wsLink,
        httpLink
      )
    : httpLink;

export const client = new ApolloClient({ link, cache: new InMemoryCache() });
