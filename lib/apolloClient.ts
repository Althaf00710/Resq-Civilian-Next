'use client'

import { ApolloClient, InMemoryCache } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";

const httpLink = createUploadLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
  headers: {
    "GraphQL-Preflight": "1",
  },
});

const authLink = setContext((_, { headers }) => {
  if (typeof window === 'undefined') return { headers }
  const token = localStorage.getItem('resq_jwt')
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
})

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})
