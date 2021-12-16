import { shopOrigin, ShopOrigin } from '@shopfabrik/shopify-data';
import * as crypto from 'crypto';
import { apply, either, string } from 'fp-ts';
import type { Either } from 'fp-ts/Either';
import { identity, pipe } from 'fp-ts/function';
import type { URLSearchParams } from 'url';

export const verifyHmac: VerifyFn = verify({
  key: 'hmac',
  separator: '&',
  encodeComponent: encodeURIComponent,
  encodeArrayParams: (params) => `["${params.join('", "')}"]`,
});

export const verifySignature: VerifyFn = verify({
  key: 'signature',
  separator: '',
  encodeComponent: identity,
  encodeArrayParams: (params) => params.join(','),
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

type VerifyConfig = EncodeSearchParamsConfig & {
  readonly separator: string;
};

function verify(config: VerifyConfig): VerifyFn {
  const _encodeSearchParams = encodeSearchParams(config);

  return (searchParams) => (env) => {
    return pipe(
      apply.sequenceS(either.Apply)({
        hmac: getHmacFromSearch(config.key)(searchParams),
        shopOrigin: getShopOriginFromSearch(searchParams),
      }),
      either.chain(({ hmac, shopOrigin }) => {
        return isValidPayload({
          hmac,
          payload: _encodeSearchParams(searchParams).join(config.separator),
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

type EncodeSearchParamsConfig = EncodeSearchEntryConfig & {
  readonly key: string;
};

function encodeSearchParams(config: EncodeSearchParamsConfig) {
  return (searchParams: URLSearchParams) => {
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
  readonly encodeComponent: (component: string) => string;
  readonly encodeArrayParams: (params: ReadonlyArray<string>) => string;
};

const ARRAY_PARAM_RX = /\[\]$/;

function encodeSearchEntry(config: EncodeSearchEntryConfig) {
  return (key: string, values: ReadonlyArray<string>): readonly [string, string] => {
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
