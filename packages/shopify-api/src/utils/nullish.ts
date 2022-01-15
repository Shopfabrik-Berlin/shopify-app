export type Nullish = null | undefined;

export function is(x: unknown): x is Nullish {
  return x == null;
}

export function isNot<T>(x: T | Nullish): x is T {
  return !is(x);
}
