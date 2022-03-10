import type { ShopOrigin } from '@shopfabrik/shopify-data';
import type { ApiCredentials } from '../apiCredentials';
import { HttpResponseError } from '../utils/error';

export type GetAccessTokenEnv = {
  fetch: (url: string, init: RequestInit) => Promise<Response>;
};

type RequestInit = {
  body?: string;
  headers?: Record<string, string>;
  method?: string;
};

type Response = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

export type GetAccessTokenInput = {
  api: ApiCredentials;
  code: string;
  shopOrigin: ShopOrigin;
};

export type GetAccessTokenPayload = {
  accessToken: string;
  scopes: readonly string[];
};

type FetchAccessTokenPayload = {
  access_token: string;
  scope: string;
};

export async function getAccessToken(
  env: GetAccessTokenEnv,
  input: GetAccessTokenInput,
): Promise<GetAccessTokenPayload> {
  const response = await env.fetch(`https://${input.shopOrigin}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      client_id: input.api.key,
      client_secret: input.api.secret,
      code: input.code,
    }),
  });

  if (!response.ok) {
    throw new HttpResponseError('Failed fetching shopify access token', response);
  }

  const data = (await response.json()) as FetchAccessTokenPayload;

  return {
    accessToken: data.access_token,
    scopes: data.scope.split(','),
  };
}
