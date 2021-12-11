import type * as fc from 'fast-check';

export type Map<A extends Readonly<Record<string, unknown>>> = {
  readonly [K in keyof A]-?: fc.Arbitrary<A[K]>;
};
