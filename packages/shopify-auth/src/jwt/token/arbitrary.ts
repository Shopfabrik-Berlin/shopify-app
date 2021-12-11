import { shopOrigin, ShopOrigin } from '@shopfabrik/shopify-data';
import type { JsonValue } from 'fast-check';
import * as fc from 'fast-check';
import { task, taskEither } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import type { ApiCredentials } from '../../apiCredentials';
import * as apiCredentials from '../../apiCredentials';
import type * as arbitrary from '../../utils/arbitrary';
import { sign } from '../jwt';

export type ArbitraryParts = {
  readonly apiCredentials: ApiCredentials;
  readonly shopOrigin: ShopOrigin;
  readonly payload?: Readonly<JsonValue>;
};

export type ArbitraryConfig = arbitrary.Map<ArbitraryParts>;

const DEFAULT_CONFIG: ArbitraryConfig = {
  apiCredentials: apiCredentials.arbitrary(),
  shopOrigin: shopOrigin.arbitrary(),
  payload: fc.option(fc.jsonValue()),
};

export const arbitraryWithParts = (
  config?: ArbitraryConfig,
): fc.Arbitrary<Promise<readonly [string, ArbitraryParts]>> => {
  return fc
    .record({
      ...DEFAULT_CONFIG,
      ...config,
    })
    .map((parts) => {
      const normalizedPayload = JSON.parse(JSON.stringify(parts.payload)) as JsonValue;

      return pipe(
        sign(
          {
            shopOrigin: parts.shopOrigin,
            payload: normalizedPayload,
          },
          {
            noTimestamp: true,
          },
        )(parts.apiCredentials),
        taskEither.fold(
          (error) => () => Promise.reject(error),
          (token) => {
            return task.of([
              token,
              {
                ...parts,
                payload: normalizedPayload,
              },
            ] as const);
          },
        ),
      )();
    });
};
