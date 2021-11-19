export function isDefined<A>(x: A | null | undefined): x is A {
  return x != null;
}
