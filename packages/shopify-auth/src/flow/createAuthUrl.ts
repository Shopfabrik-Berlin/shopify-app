import type { ShopOrigin } from '@shopfabrik/shopify-data';
import * as crypto from 'crypto';
import { URL } from 'url';

export type CreateAuthUrlInput = {
  accessMode: 'online' | 'offline';
  apiKey: string;
  redirectUri: string;
  scopes: readonly string[];
  shopOrigin: ShopOrigin;
  state: string;
};

export function createAuthUrl(input: CreateAuthUrlInput): URL {
  const url = new URL(`/admin/oauth/authorize`, `https://${input.shopOrigin}`);

  url.searchParams.set('client_id', input.apiKey);
  url.searchParams.set('redirect_uri', input.redirectUri);
  url.searchParams.set('scope', input.scopes.join(','));
  url.searchParams.set('state', input.state);

  if (input.accessMode === 'online') {
    url.searchParams.set('grant_options[]', 'per-user');
  }

  return url;
}

export function genAuthState(): string {
  return crypto.randomBytes(16).toString('hex');
}
