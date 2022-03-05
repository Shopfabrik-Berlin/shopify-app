import { shopOrigin, ShopOrigin } from '@shopfabrik/shopify-data';
import * as crypto from 'crypto';
import type { URLSearchParams } from 'url';
import { InvalidArgumentError } from '../utils/error';
import * as searchParams from '../utils/searchParams';

export const verifyHmac: VerifyFn = verify({
  key: 'hmac',
  separator: '&',
  encodeComponent: encodeURIComponent,
  encodeArrayParams: (params) => `["${params.join('", "')}"]`,
});

export const verifySignature: VerifyFn = verify({
  key: 'signature',
  separator: '',
  encodeComponent: (component) => component,
  encodeArrayParams: (params) => params.join(','),
});

export type VerifyFn = (env: VerifyEnv, searchParams: URLSearchParams) => Promise<ShopOrigin>;

export type VerifyEnv = {
  getApiSecret: (shopOrigin: ShopOrigin) => string | PromiseLike<string>;
};

export class InvalidHmacError extends Error {
  constructor(hmac: string) {
    super(`Invalid HMAC: ${hmac}`);
    Object.defineProperty(this, 'name', { value: 'InvalidHmacError' });
  }
}

type VerifyConfig = EncodeSearchParamsConfig & {
  separator: string;
};

function verify(config: VerifyConfig): VerifyFn {
  const _encodeSearchParams = encodeSearchParams(config);

  return async (env, _searchParams) => {
    const hmac = searchParams.get(_searchParams, config.key);
    const _shopOrigin = parseShopOrigin(_searchParams);

    const _isValidPayload = isValidPayload({
      hmac,
      payload: _encodeSearchParams(_searchParams).join(config.separator),
      secret: await env.getApiSecret(_shopOrigin),
    });

    if (!_isValidPayload) {
      throw new InvalidHmacError(hmac);
    }

    return _shopOrigin;
  };
}

function parseShopOrigin(_searchParams: URLSearchParams): ShopOrigin {
  const shop = searchParams.get(_searchParams, 'shop');

  if (!shopOrigin.is(shop)) {
    throw new InvalidArgumentError(`Invalid "shop" query param: ${String(shop)}`);
  }

  return shop;
}

type EncodeSearchParamsConfig = EncodeSearchEntryConfig & {
  key: string;
};

function encodeSearchParams(config: EncodeSearchParamsConfig) {
  return (searchParams: URLSearchParams): string[] => {
    const searchParamsMap = new Map(
      [...searchParams.keys()]
        .filter((key) => key !== config.key)
        .map((key) => encodeSearchEntry(config)(key, searchParams.getAll(key))),
    );

    return [...searchParamsMap.entries()]
      .map((entry) => entry.join('='))
      .sort((x, y) => x.localeCompare(y));
  };
}

type EncodeSearchEntryConfig = {
  encodeComponent: (component: string) => string;
  encodeArrayParams: (params: readonly string[]) => string;
};

const ARRAY_PARAM_RX = /\[\]$/;

function encodeSearchEntry(config: EncodeSearchEntryConfig) {
  return (key: string, values: readonly string[]): [string, string] => {
    const encodedKey = config.encodeComponent(key.replace(ARRAY_PARAM_RX, ''));
    const encodedValues = values.map(config.encodeComponent);

    const encodedValue =
      ARRAY_PARAM_RX.test(key) || values.length > 1
        ? config.encodeArrayParams(encodedValues)
        : encodedValues[0];

    return [encodedKey, encodedValue];
  };
}

type IsValidPayloadConfig = {
  hmac: string;
  payload: string;
  secret: string;
};

function isValidPayload(config: IsValidPayloadConfig): boolean {
  try {
    const validHmac = crypto.createHmac('sha256', config.secret).update(config.payload).digest();
    const compareHmac = Buffer.from(config.hmac, 'hex');
    return crypto.timingSafeEqual(validHmac, compareHmac);
  } catch {
    return false;
  }
}
