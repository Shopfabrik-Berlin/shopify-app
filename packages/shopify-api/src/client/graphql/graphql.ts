import { ApolloClient, HttpLink, InMemoryCache, isApolloError } from '@apollo/client/core';
import fetch from 'cross-fetch';
import { taskEither } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import type { TaskEither } from 'fp-ts/TaskEither';
import type { ReadonlyRecord } from '../../types';
import { mkMemoized } from '../../utils';
import { GraphQLRequestError } from './GraphqlRequestError';
import type { GraphQLRequestConfig, MutateConfig, QueryConfig } from './request';

export interface ClientGraphqlEnv {
  readonly shopify: {
    readonly client: {
      readonly graphql: {
        readonly mutate: <A extends ReadonlyRecord, I extends ReadonlyRecord = ReadonlyRecord>(
          config: MutateConfig<A, I>,
        ) => TaskEither<GraphQLRequestError, A>;

        readonly query: <A extends ReadonlyRecord, I extends ReadonlyRecord = ReadonlyRecord>(
          config: QueryConfig<A, I>,
        ) => TaskEither<GraphQLRequestError, A>;
      };
    };
  };
}

export type ClientGraphqlPayload<A> = (env: ClientGraphqlEnv) => TaskEither<GraphQLRequestError, A>;

export type ClientGraphqlConfig = {
  readonly accessToken: string;
  readonly shopOrigin: string;
};

export function mkClientGraphqlEnv(config: ClientGraphqlConfig): ClientGraphqlEnv {
  const getClient = mkMemoized(() => {
    return new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({
        uri: `https://${config.shopOrigin}/admin/api/2021-10/graphql.json`,
        headers: {
          'X-Shopify-Access-Token': config.accessToken,
        },
        fetch,
      }),
    });
  });

  return {
    shopify: {
      client: {
        graphql: {
          mutate: <A extends ReadonlyRecord, I extends ReadonlyRecord = ReadonlyRecord>(
            config: MutateConfig<A, I>,
          ) => {
            return pipe(
              taskEither.tryCatch(() => getClient().mutate(config), toRequestError(config)),
              taskEither.filterOrElse(
                (response): response is typeof response & { data: A } => !!response.data,
                (response) =>
                  new GraphQLRequestError({
                    config,
                    graphqlErrors: response.errors,
                  }),
              ),
              taskEither.map((response) => response.data),
            );
          },

          query: <A extends ReadonlyRecord, I extends ReadonlyRecord = ReadonlyRecord>(
            config: QueryConfig<A, I>,
          ) => {
            return pipe(
              taskEither.tryCatch(() => getClient().query(config), toRequestError(config)),
              taskEither.filterOrElse(
                (response) => !!response.data,
                (response) =>
                  new GraphQLRequestError({
                    message: response.error?.message,
                    config,
                    graphqlErrors: response.error?.graphQLErrors || response.errors,
                    networkError: response.error?.networkError ?? undefined,
                  }),
              ),
              taskEither.map((response) => response.data),
            );
          },
        },
      },
    },
  };
}

function toRequestError<A extends ReadonlyRecord, I extends ReadonlyRecord>(
  config: GraphQLRequestConfig<A, I>,
) {
  return (reason: unknown): GraphQLRequestError => {
    if (reason instanceof Error && isApolloError(reason)) {
      return new GraphQLRequestError({
        message: reason.message,
        config,
        graphqlErrors: reason.graphQLErrors,
        networkError: reason.networkError ?? undefined,
      });
    }

    if (reason instanceof Error) {
      return new GraphQLRequestError({
        message: reason.message,
        config,
      });
    }

    return new GraphQLRequestError({
      message: `Unknown GraphQL Request Error: ${String(reason)}`,
      config,
    });
  };
}
