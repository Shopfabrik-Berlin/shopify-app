import { ApolloClient, ApolloError, HttpLink, InMemoryCache } from '@apollo/client/core';
import type { ShopOrigin } from '@shopfabrik/shopify-data';
import type { ExecutionResult } from 'graphql';
import { FetchFn, HttpResponseError, SHOPIFY_ACCESS_TOKEN_HEADER } from '../fetch';
import * as document from './document';
import fragments from './fragment-matcher.generated';
import type { GraphQLRequest } from './GraphQLRequest';
import { GraphQLResponseError } from './GraphQLResponseError';

export interface GraphQLClient {
  readonly request: <A, I>(request: GraphQLRequest<A, I>) => Promise<A>;
}

export type GraphQLClientConfig = {
  readonly accessToken: string;
  readonly shopOrigin: ShopOrigin;
  readonly fetch: FetchFn;
};

export function createClient(config: GraphQLClientConfig): GraphQLClient {
  const client = new ApolloClient({
    cache: new InMemoryCache({
      possibleTypes: fragments.possibleTypes,
    }),
    link: new HttpLink({
      uri: `https://${config.shopOrigin}/admin/api/2022-10/graphql.json`,
      fetch: config.fetch as never,
      headers: {
        [SHOPIFY_ACCESS_TOKEN_HEADER]: config.accessToken,
      },
    }),
    defaultOptions: {
      mutate: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
    },
  });

  return fromApolloClient(client);
}

function fromApolloClient(client: ApolloClient<unknown>): GraphQLClient {
  return {
    request: async (request) => {
      const { type } = document.getOperationContext(request.document);

      try {
        switch (type) {
          case 'mutation':
            return await mutation(client, request);

          case 'query':
            return await query(client, request);

          default:
            throw new Error(`Unsupported GraphQL operation type: ${type}`);
        }
      } catch (error) {
        throw toHttpResponseError(error) || error;
      }
    },
  };
}

async function mutation<A, I>(
  client: ApolloClient<unknown>,
  request: GraphQLRequest<A, I>,
): Promise<A> {
  const result = await client.mutate({
    mutation: request.document,
    variables: request.variables,
  });

  return handleResult(request, result);
}

async function query<A, I>(
  client: ApolloClient<unknown>,
  request: GraphQLRequest<A, I>,
): Promise<A> {
  const result = await client.query({
    query: request.document,
    variables: request.variables,
  });

  return handleResult(request, result);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleResult<A>(request: GraphQLRequest<A, any>, result: ExecutionResult<A>): A {
  if (result.errors?.length) {
    throw new GraphQLResponseError({
      request,
      graphqlErrors: result.errors,
    });
  }

  if (!result.data) {
    throw new GraphQLResponseError({
      message: 'No data in GraphQL response',
      request,
    });
  }

  return result.data;
}

function toHttpResponseError(error: unknown): HttpResponseError | null {
  return error instanceof ApolloError && error.networkError && 'response' in error.networkError
    ? new HttpResponseError(error.networkError.response)
    : null;
}
