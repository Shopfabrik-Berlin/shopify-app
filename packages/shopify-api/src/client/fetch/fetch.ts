export interface FetchEnv<R extends Response = Response> {
  readonly fetch: FetchFn<R>;
}

export type FetchFn<R extends Response = Response, A = string> = (
  url: string,
  init?: RequestInit<A>,
) => Promise<R>;

export type RequestInit<A = string> = {
  readonly method?: RequestMethod;
  readonly headers?: Record<string, string>;
  readonly body?: A;
};

export type RequestMethod =
  | 'CONNECT'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'TRACE';

export interface Response {
  readonly status: number;
  readonly url?: string;
  readonly json: () => Promise<unknown>;
}

export const SHOPIFY_ACCESS_TOKEN_HEADER = 'x-shopify-access-token';
