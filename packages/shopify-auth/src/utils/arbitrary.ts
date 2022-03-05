import type * as fc from 'fast-check';

export type Map<A extends Record<string, unknown>> = {
  [K in keyof A]-?: fc.Arbitrary<A[K]>;
};
