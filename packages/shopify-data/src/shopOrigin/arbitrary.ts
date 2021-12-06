import * as fc from 'fast-check';
import * as arb from '../utils/arbitrary';
import { is, ShopOrigin } from './ShopOrigin';

export type ArbitraryParts = {
  readonly id: string;
  readonly tld: string;
};

export type ArbitraryConfig = arb.Map<ArbitraryParts>;

// [a-zA-Z0-9][a-zA-Z0-9-]*
const id: ArbitraryConfig['id'] = fc
  .tuple(arb.alphaNumericChar, fc.stringOf(arb.alphaNumericHyphenChar))
  .map((xs) => xs.join(''));

// (com|io)
const tld: ArbitraryConfig['tld'] = fc.oneof(fc.constant('com'), fc.constant('io'));

const DEFAULT_CONFIG: ArbitraryConfig = {
  id,
  tld,
};

// ^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.(com|io)$
export const arbitrary = (config?: Partial<ArbitraryConfig>): fc.Arbitrary<ShopOrigin> => {
  return fc
    .record({
      ...DEFAULT_CONFIG,
      ...config,
    })
    .map((shop) => {
      const shopOrigin = `${shop.id}.myshopify.${shop.tld}`;

      if (!is(shopOrigin)) {
        throw new Error(`Invalid ShopOrigin: ${shopOrigin}`);
      }

      return shopOrigin;
    });
};
