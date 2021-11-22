import { ApolloClient, InMemoryCache } from '@apollo/client';
import { either } from 'fp-ts';
import type { TaskEither } from 'fp-ts/TaskEither';
import type { ReadonlyRecord } from '../../types';
import { mkMemoized } from '../../utils';
import { GraphQLRequestError } from './GraphqlRequestError';
import type { MutateConfig, QueryConfig } from './request';

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
      uri: `https://${config.shopOrigin}/admin/api/2021-10/graphql.json`,
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
      },
      cache: new InMemoryCache(),
    });
  });

  return {
    shopify: {
      client: {
        graphql: {
          mutate:
            <A extends ReadonlyRecord, I extends ReadonlyRecord = ReadonlyRecord>(
              config: MutateConfig<A, I>,
            ) =>
            async () => {
              const response = await getClient().mutate(config);

              if (!response.data) {
                return either.left(
                  new GraphQLRequestError({
                    config,
                    graphqlErrors: response.errors,
                  }),
                );
              }

              return either.right(response.data);
            },

          query:
            <A extends ReadonlyRecord, I extends ReadonlyRecord = ReadonlyRecord>(
              config: QueryConfig<A, I>,
            ) =>
            async () => {
              const response = await getClient().query(config);

              if (response.error) {
                console.log(JSON.stringify(response, null, 2));

                return either.left(
                  new GraphQLRequestError({
                    message: response.error.message,
                    config,
                    graphqlErrors: response.error.graphQLErrors,
                    networkError: response.error.networkError ?? undefined,
                  }),
                );
              }

              return either.right(response.data);
            },
        },
      },
    },
  };
}
