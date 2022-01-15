import { gid, GID } from '@shopfabrik/shopify-data';
import * as cache from '../../cache';
import { rest, RestClienEnv } from '../../client';
import { HttpResponseError } from '../../client/fetch';
import { rio } from '../../utils';

export type Theme = {
  readonly id: number;
  readonly admin_graphql_api_id: GID;
  readonly created_at: string;
  readonly name: string;
  readonly previewable: boolean;
  readonly processing: boolean;
  readonly role: 'demo' | 'main' | 'unpublished';
  readonly theme_store_id: number | null;
  readonly updated_at: string;
};

const AllThemesSymbol = Symbol('AllThemes');

export function getAllThemesCache(env: cache.CacheEnv): cache.Cache<void, Promise<Theme[]>> {
  return cache.getStore(env).getCache(AllThemesSymbol);
}

const ThemeSymbol = Symbol('Theme');

export function getThemeCache(env: cache.CacheEnv): cache.Cache<GID, Promise<Theme>> {
  return cache.getStore(env).getCache(ThemeSymbol);
}

export type List = rio.p.TypeFn<typeof _list>;

export const list = cache.withCacheEffect(
  cache.withCache(getAllThemesCache, _list),
  (env, _, themes) => {
    const themeCache = getThemeCache(env);
    for (const theme of themes) {
      themeCache.set(theme.admin_graphql_api_id, Promise.resolve(theme));
    }
  },
);

type FetchListPayload = {
  themes: Theme[];
};

async function _list(env: RestClienEnv): Promise<Theme[]> {
  const data = await rest.getClient(env).fetch<FetchListPayload>(`/themes.json`);
  return data.themes;
}

export type Get = rio.p.TypeFn<typeof get>;

export const get = cache.withCache(getThemeCache, _get);

type GetFetchPayload = {
  theme: Theme;
};

async function _get(env: RestClienEnv, id: GID): Promise<Theme> {
  const data = await rest.getClient(env).fetch<GetFetchPayload>(`/themes/${gid.getId(id)}.json`);
  return data.theme;
}

export type Find = rio.p.TypeFn<typeof find>;

export const find = rio.mapEnv(_find, rio.sequenceEnv({ get }));

type _FindEnv = rio.RemoveEnvS<{
  get: Get;
}>;

async function _find(env: _FindEnv, id: GID): Promise<Theme | null> {
  try {
    return await env.get(id);
  } catch (error) {
    if (HttpResponseError.is(error) && error.response.status === 404) {
      return null;
    }

    throw error;
  }
}
