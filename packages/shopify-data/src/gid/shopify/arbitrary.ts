import * as fc from 'fast-check';
import * as gidArbitrary from '../arbitrary';
import type { GID } from '../GID';
import { NAMESPACE } from './ShopifyGID';

export type ArbitraryConfig = Omit<gidArbitrary.ArbitraryConfig, 'namespace'>;

export const arbitraryWithParts = (
  config?: Partial<ArbitraryConfig>,
): fc.Arbitrary<[GID, gidArbitrary.ArbitraryParts]> => {
  return gidArbitrary.arbitraryWithParts({
    ...config,
    namespace: fc.constant(NAMESPACE),
  });
};

// ^gid:\/\/shopify\/([\w-]+)\/([\w-]+)(?:\?(.*))*$
export const arbitrary = (config?: Partial<ArbitraryConfig>): fc.Arbitrary<GID> => {
  return arbitraryWithParts(config).map(([gid]) => gid);
};
