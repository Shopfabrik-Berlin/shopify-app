export type CacheEnv = {
  readonly [S in typeof CacheStoreSymbol]: CacheStore;
};

export interface CacheStore {
  getCache<K, V>(namespace: symbol): Cache<K, V>;
}

export interface Cache<K, V> {
  get(key: K): V | null | undefined;
  set(key: K, value: V): unknown;
  delete(key: K): unknown;
}

const CacheStoreSymbol = Symbol('CacheStore');

export type CacheEnvConfig = {
  createCache?: <K, V>() => Cache<K, V>;
};

export function createEnv(config?: CacheEnvConfig): CacheEnv {
  return {
    [CacheStoreSymbol]: createCacheStore(config?.createCache),
  };
}

function createCacheStore(
  createCache: CacheEnvConfig['createCache'] = defaultCreateCache,
): CacheStore {
  const cache = createCache<symbol, Cache<never, never>>();

  return {
    getCache: <K, V>(namespace: symbol) => {
      return getOrCreate<symbol, Cache<K, V>>(cache, namespace, createCache);
    },
  };
}

function defaultCreateCache<K, V>(): Cache<K, V> {
  return new Map();
}

export function getOrCreate<K, V>(cache: Cache<K, V>, key: K, createValue: () => V): V {
  let value = cache.get(key);
  if (!value) {
    value = createValue();
    cache.set(key, value);
  }
  return value;
}

export function hasCache<A extends Partial<CacheEnv>>(env: A): env is A & CacheEnv {
  return CacheStoreSymbol in env;
}

export function getStore(env: CacheEnv): CacheStore {
  return env[CacheStoreSymbol];
}

export function normalize<K, KN, V>(cache: Cache<KN, V>, normalize: (key: K) => KN): Cache<K, V> {
  return {
    get(key) {
      return cache.get(normalize(key));
    },

    set(key, value) {
      return cache.set(normalize(key), value);
    },

    delete(key) {
      return cache.delete(normalize(key));
    },
  };
}

export function withCache<R, I, O>(
  getCache: (env: CacheEnv) => Cache<I, O>,
  f: (env: R, input: I) => O,
) {
  return (env: R & Partial<CacheEnv>, input: I): O => {
    const g = (): O => f(env, input);
    return hasCache(env) ? getOrCreate(getCache(env), input, g) : g();
  };
}

export function withCacheEffect<R, I, O>(
  f: (env: R, input: I) => Promise<O>,
  effect: (env: R & CacheEnv, input: I, output: O) => void | PromiseLike<void>,
) {
  return async (env: R & Partial<CacheEnv>, input: I): Promise<O> => {
    const result = await f(env, input);

    if (hasCache(env)) {
      await effect(env, input, result);
    }

    return result;
  };
}
