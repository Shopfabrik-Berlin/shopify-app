import { createClient, GraphQLClient, GraphQLClientConfig } from './client';

export type GraphQLClientEnv = {
  readonly [S in typeof GraphQLClientSymbol]: GraphQLClient;
};

const GraphQLClientSymbol = Symbol('GraphQLClient');

export type GraphQLClientEnvConfig = GraphQLClientConfig;

export function createEnv(config: GraphQLClientEnvConfig): GraphQLClientEnv {
  return {
    [GraphQLClientSymbol]: createClient(config),
  };
}

export function getClient(env: GraphQLClientEnv): GraphQLClient {
  return env[GraphQLClientSymbol];
}
