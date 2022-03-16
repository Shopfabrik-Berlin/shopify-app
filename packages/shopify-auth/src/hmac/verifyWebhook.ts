import { shopOrigin, ShopOrigin } from '@shopfabrik/shopify-data';
import type { IncomingHttpHeaders } from 'http';
import { InvalidArgumentError } from '../utils/error';
import * as headers from '../utils/headers';
import { InvalidHmacError } from './error';
import { isValidPayload } from './utils';

export type VerifyWebhookEnv = {
  getApiSecret: (shopOrigin: ShopOrigin) => string | PromiseLike<string>;
};

export type VerifyWebhookInput = {
  body: Buffer;
  headers: IncomingHttpHeaders;
};

const HEADER_SHOP = 'x-shopify-shop-domain';
const HEADER_HMAC = 'x-shopify-hmac-sha256';

export async function verifyWebhook(
  env: VerifyWebhookEnv,
  input: VerifyWebhookInput,
): Promise<ShopOrigin> {
  const _shopOrigin = headers.get(input.headers, HEADER_SHOP);
  if (!shopOrigin.is(_shopOrigin)) {
    throw new InvalidArgumentError(`Invalid ${HEADER_SHOP} header: ${String(_shopOrigin)}`);
  }

  const hmac = headers.get(input.headers, HEADER_HMAC);

  const _isValidPayload = isValidPayload({
    hmac: Buffer.from(hmac, 'base64'),
    payload: input.body,
    secret: await env.getApiSecret(_shopOrigin),
  });
  if (!_isValidPayload) {
    throw new InvalidHmacError();
  }

  return _shopOrigin;
}
