import * as fc from 'fast-check';
import type * as arb from '../utils/arbitrary';
import type { ApiCredentials } from './ApiCredentials';

export type ArbitraryConfig = arb.Map<ApiCredentials>;

const DEFAULT_CONFIG: ArbitraryConfig = {
  key: fc.string(),
  secret: fc.string().filter((x) => x.length > 0),
};

export const arbitrary = (config?: ArbitraryConfig): fc.Arbitrary<ApiCredentials> => {
  return fc.record({
    ...DEFAULT_CONFIG,
    ...config,
  });
};
