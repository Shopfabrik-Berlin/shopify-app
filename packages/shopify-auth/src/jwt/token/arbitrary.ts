import { shopOrigin, ShopOrigin } from '@shopfabrik/shopify-data';
import type { JsonValue } from 'fast-check';
import * as fc from 'fast-check';
import type { ApiCredentials } from '../../apiCredentials';
import * as apiCredentials from '../../apiCredentials';
import type * as arbitrary from '../../utils/arbitrary';
import { sign } from '../jwt';

export type ArbitraryParts = {
  apiCredentials: ApiCredentials;
  shopOrigin: ShopOrigin;
  payload?: JsonValue;
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
    .map(async (parts) => {
      const payload = JSON.parse(JSON.stringify(parts.payload)) as JsonValue;

      const token = await sign(
        {
          credentials: parts.apiCredentials,
          shopOrigin: parts.shopOrigin,
          options: {
            noTimestamp: true,
          },
        },
        { payload },
      );

      return [
        token,
        {
          ...parts,
          payload,
        },
      ] as const;
    });
};
