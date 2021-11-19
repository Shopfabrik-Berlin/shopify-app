export function mkMemoized<A>(f: () => A): () => A {
  let value: A;

  return () => {
    if (value === undefined) {
      value = f();
    }

    return value;
  };
}
