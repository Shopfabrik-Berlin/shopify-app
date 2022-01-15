// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoized<F extends (...args: any[]) => unknown>(f: F): F {
  let result: unknown;
  const memoizedF = (...args: Parameters<F>): unknown => {
    if (!result) {
      result = f(...args);
    }
    return result;
  };
  return memoizedF as F;
}
