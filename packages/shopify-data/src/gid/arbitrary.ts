import * as fc from 'fast-check';
import * as arb from '../utils/arbitrary';
import { GID, unsafeEncode } from './GID';

export type ArbitraryParts = {
  readonly namespace: string;
  readonly type: string;
  readonly id: string;
  readonly params?: Readonly<Record<string, string>>;
};

export type ArbitraryConfig = arb.Map<ArbitraryParts>;

// [\w-]+
const mainPart: fc.Arbitrary<string> = fc.stringOf(arb.wordHyphenChar, { minLength: 1 });

const params: ArbitraryConfig['params'] = fc.option(
  fc.object({
    key: fc.string(),
    values: [fc.string()],
  }) as fc.Arbitrary<Record<string, string>>,
  { nil: undefined },
);

const DEFAULT_CONFIG: ArbitraryConfig = {
  namespace: mainPart,
  type: mainPart,
  id: mainPart,
  params,
};

export const arbitraryWithParts = (
  config?: Partial<ArbitraryConfig>,
): fc.Arbitrary<[GID, ArbitraryParts]> => {
  return fc
    .record({
      ...DEFAULT_CONFIG,
      ...config,
    })
    .map((parts) => {
      return [unsafeEncode(parts.namespace)(parts.type)(parts.id, parts.params), parts];
    });
};

// ^gid:\/\/([\w-]+)\/([\w-]+)\/([\w-]+)(?:\?(.*))*$
export const arbitrary = (config?: Partial<ArbitraryConfig>): fc.Arbitrary<GID> => {
  return arbitraryWithParts(config).map(([gid]) => gid);
};
