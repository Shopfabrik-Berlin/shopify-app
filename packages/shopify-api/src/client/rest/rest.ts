import { createClient, RestClient, RestClientConfig } from './client';

export type RestClienEnv = {
  readonly [S in typeof RestClientSymbol]: RestClient;
};

export const RestClientSymbol = Symbol('RestClient');

export type RestClientEnvConfig = RestClientConfig;

export function createEnv(config: RestClientEnvConfig): RestClienEnv {
  return {
    [RestClientSymbol]: createClient(config),
  };
}

export function getClient(env: RestClienEnv): RestClient {
  return env[RestClientSymbol];
}
