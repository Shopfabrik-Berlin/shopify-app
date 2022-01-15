import type { ShopOrigin } from '@shopfabrik/shopify-data';
import type * as fetch from './fetch';
import * as graphql from './graphql';
import * as rest from './rest';

export type ClientEnv = graphql.GraphQLClientEnv & rest.RestClienEnv;

export type ClientEnvConfig = {
  accessToken: string;
  fetch: fetch.FetchFn;
  shopOrigin: ShopOrigin;
};

export function createEnv(config: ClientEnvConfig): ClientEnv {
  return {
    ...graphql.createEnv(config),
    ...rest.createEnv(config),
  };
}
