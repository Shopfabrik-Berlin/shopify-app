import { shopOrigin, ShopOrigin } from '@shopfabrik/shopify-data';
import * as crypto from 'crypto';
import { apply, either, string } from 'fp-ts';
import type { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import type { URLSearchParams } from 'url';

export const verifyHmac: VerifyFn = verify({
  key: 'hmac',
  separator: '&',
  normalizeArrayParams: (params) => `["${params.join('", "')}"]`,
});

export const verifySignature: VerifyFn = verify({
  key: 'signature',
  separator: '',
  normalizeArrayParams: (params) => params.join(','),
});

type VerifyFn = (
  searchParams: URLSearchParams,
) => (config: VerifyEnv) => Either<HmacError, ShopOrigin>;

export type VerifyEnv = {
  readonly getApiSecret: (shopOrigin: ShopOrigin) => string;
};

export type HmacErrorCode = 'INVALID_HMAC' | 'INVALID_INPUT';

export class HmacError extends Error {
  readonly code: HmacErrorCode;
  readonly query: string;

  constructor(message: string, code: HmacErrorCode, query: string) {
    super(message);

    this.code = code;
    this.query = query;

    Object.defineProperty(this, 'name', { value: 'HmacError' });
  }
}

type VerifyConfig = NormalizeSearchParamsConfig & {
  readonly separator: string;
};

function verify(config: VerifyConfig): VerifyFn {
  const _normalizeSearchParams = normalizeSearchParams(config);

  return (searchParams) => (env) => {
    return pipe(
      apply.sequenceS(either.Apply)({
        hmac: getHmacFromSearch(config.key)(searchParams),
        shopOrigin: getShopOriginFromSearch(searchParams),
      }),
      either.chain(({ hmac, shopOrigin }) => {
        return isValidPayload({
          hmac,
          payload: _normalizeSearchParams(searchParams).join(config.separator),
          secret: env.getApiSecret(shopOrigin),
        })
          ? either.right(shopOrigin)
          : either.left(
              new HmacError(
                `Invalid HMAC: ${String(searchParams.get(config.key))}`,
                'INVALID_HMAC',
                searchParams.toString(),
              ),
            );
      }),
    );
  };
}

function getShopOriginFromSearch(searchParams: URLSearchParams): Either<HmacError, ShopOrigin> {
  return pipe(
    searchParams.get('shop'),
    either.fromPredicate(shopOrigin.is, (shop) => {
      return new HmacError(
        `Invalid "shop" query param: ${String(shop)}`,
        'INVALID_INPUT',
        searchParams.toString(),
      );
    }),
  );
}

function getHmacFromSearch(hmacKey: string) {
  return (searchParams: URLSearchParams): Either<HmacError, string> => {
    return pipe(
      searchParams.get(hmacKey),
      either.fromPredicate(string.isString, () => {
        return new HmacError(
          `Missing "${hmacKey}" query param`,
          'INVALID_INPUT',
          searchParams.toString(),
        );
      }),
    );
  };
}

type NormalizeSearchParamsConfig = NormalizeSearchEntryConfig & {
  readonly key: string;
};

function normalizeSearchParams(config: NormalizeSearchParamsConfig) {
  return (searchParams: URLSearchParams) => {
    const searchParamsMap = new Map(
      [...searchParams.keys()]
        .filter((key) => key !== config.key)
        .map((key) => normalizeSearchEntry(config)(key, searchParams.getAll(key))),
    );

    return [...searchParamsMap.entries()]
      .map((entry) => entry.join('='))
      .sort((x, y) => x.localeCompare(y));
  };
}

type NormalizeSearchEntryConfig = {
  readonly normalizeArrayParams: (params: ReadonlyArray<string>) => string;
};

const ARRAY_PARAM_RX = /\[\]$/;

function normalizeSearchEntry(config: NormalizeSearchEntryConfig) {
  return (key: string, values: ReadonlyArray<string>): readonly [string, string] => {
    const normalizedKey = encodeURIComponent(key.replace(ARRAY_PARAM_RX, ''));
    const normalizedValues = values.map(encodeURIComponent);

    const normalizedValue =
      ARRAY_PARAM_RX.test(key) || values.length > 1
        ? config.normalizeArrayParams(normalizedValues)
        : normalizedValues[0];

    return [normalizedKey, normalizedValue];
  };
}

type IsValidPayloadConfig = {
  readonly hmac: string;
  readonly payload: string;
  readonly secret: string;
};

function isValidPayload(config: IsValidPayloadConfig): boolean {
  const localHmac = crypto.createHmac('sha256', config.secret).update(config.payload).digest();

  try {
    return crypto.timingSafeEqual(localHmac, Buffer.from(config.hmac, 'hex'));
  } catch {
    return false;
  }
}
