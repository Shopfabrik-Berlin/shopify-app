import type { ShopOrigin } from '@shopfabrik/shopify-data';
import { FetchFn, HttpResponseError, RequestInit } from '../fetch';

export interface RestClient {
  readonly fetch: RestFetchFn;
}

export type RestFetchFn = ReturnType<typeof createRestFetch>;

export type RestClientConfig = RestFetchConfig;

export function createClient(config: RestClientConfig): RestClient {
  return {
    fetch: createRestFetch(config),
  };
}

type RestFetchConfig = {
  accessToken: string;
  fetch: FetchFn;
  shopOrigin: ShopOrigin;
};

const REST_ACCESS_TOKEN_HEADER = 'x-shopify-access-token';

function createRestFetch(input: RestFetchConfig) {
  return async <A>(
    url: string,
    { body, headers, ...init }: RequestInit<object> = {},
  ): Promise<A> => {
    const _init = {
      ...init,

      headers: {
        ...headers,

        ...(!!body && {
          'content-type': 'application/json',
        }),

        [REST_ACCESS_TOKEN_HEADER]: input.accessToken,
      },

      ...(!!body && {
        body: JSON.stringify(body),
      }),
    };

    const response = await input.fetch(
      `https://${input.shopOrigin}/admin/api/2022-10${url}`,
      _init,
    );

    if (!isOkHttpStatus(response.status)) {
      throw new HttpResponseError(response);
    }

    return response.json() as Promise<A>;
  };
}

function isOkHttpStatus(status: number): boolean {
  return status >= 200 && status < 300;
}
