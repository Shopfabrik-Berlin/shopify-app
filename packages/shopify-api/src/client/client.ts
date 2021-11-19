import { ClientGraphqlEnv, mkClientGraphqlEnv } from './graphql';
import { ClientRestEnv, mkClientRestEnv } from './rest';

export type ClientEnv = ClientGraphqlEnv & ClientRestEnv;

export type ClientConfig = {
  readonly accessToken: string;
  readonly shopOrigin: string;
};

export function mkClientEnv(config: ClientConfig): ClientEnv {
  const restEnv = mkClientRestEnv(config);

  return {
    getDataLoader: restEnv.getDataLoader,
    shopify: {
      client: {
        graphql: mkClientGraphqlEnv(config).shopify.client.graphql,
        rest: restEnv.shopify.client.rest,
      },
    },
  };
}
