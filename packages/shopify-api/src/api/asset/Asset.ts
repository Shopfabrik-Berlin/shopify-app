import { GID, gid } from '@shopfabrik/shopify-data';
import type { RequireExactlyOne } from 'type-fest';
import * as cache from '../../cache';
import { rest } from '../../client';
import { HttpResponseError } from '../../client/fetch';
import type { RestClienEnv } from '../../client/rest';
import { rio } from '../../utils';

export type Asset = AssetWithAttachment | AssetWithValue;

export type AssetWithAttachment = AssetMeta & {
  readonly attachment: string;
};

export type AssetWithValue = AssetMeta & {
  readonly value: string;
};

export type AssetMeta = {
  readonly key: string;
  readonly checksum: string;
  readonly content_type: string;
  readonly created_at: string;
  readonly public_url: string | null;
  readonly size: number;
  readonly theme_id: number;
  readonly updated_at: string;
};

type AssetInput = {
  readonly themeId: GID;
  readonly key: string;
};

export function isWithValue(asset: Asset): asset is AssetWithValue {
  return 'value' in asset && typeof asset.value === 'string';
}

const AssetMetaSymbol = Symbol('AssetMeta');

export function getAssetMetaCache(env: cache.CacheEnv): cache.Cache<GID, Promise<AssetMeta[]>> {
  return cache.getStore(env).getCache(AssetMetaSymbol);
}

const AssetSymbol = Symbol('Asset');

export function getAssetCache(env: cache.CacheEnv): cache.Cache<AssetInput, Promise<Asset>> {
  return cache.normalize(
    cache.getStore(env).getCache<string, Promise<Asset>>(AssetSymbol),
    createAssetCacheKey,
  );
}

function createAssetCacheKey(input: AssetInput): string {
  return `${gid.getId(input.themeId)}_${input.key}`;
}

export type List = rio.p.TypeFn<typeof list>;

export const list = cache.withCache(getAssetMetaCache, _list);

type FetchListPayload = {
  assets: AssetMeta[];
};

async function _list(env: RestClienEnv, themeId: GID): Promise<AssetMeta[]> {
  const data = await rest
    .getClient(env)
    .fetch<FetchListPayload>(`/themes/${gid.getId(themeId)}/assets.json`);
  return data.assets;
}

export type Get = rio.p.TypeFn<typeof get>;

export const get = cache.withCache(getAssetCache, _get);

type GetFetchPayload = {
  asset: Asset;
};

async function _get(env: RestClienEnv, input: AssetInput): Promise<Asset> {
  const data = await rest
    .getClient(env)
    .fetch<GetFetchPayload>(
      `/themes/${gid.getId(input.themeId)}/assets.json?asset[key]=${input.key}`,
    );
  return data.asset;
}

export type Find = rio.p.TypeFn<typeof find>;

export const find = rio.mapEnv(_find, rio.sequenceEnv({ get }));

type _FindEnv = rio.RemoveEnvS<{
  get: Get;
}>;

async function _find(env: _FindEnv, input: Get['Input']): Promise<Asset | null> {
  try {
    return await env.get(input);
  } catch (error) {
    if (HttpResponseError.is(error) && error.response.status === 404) {
      return null;
    }

    throw error;
  }
}

export type Exists = rio.p.TypeFn<typeof exists>;

export const exists = rio.mapEnv(_exists, rio.sequenceEnv({ find }));

type _ExistsEnv = rio.RemoveEnvS<{
  find: Find;
}>;

async function _exists(env: _ExistsEnv, input: Find['Input']): Promise<boolean> {
  try {
    const asset = await env.find(input);
    return !!asset;
  } catch (error) {
    // demo themes will return 401
    if (HttpResponseError.is(error) && error.response.status === 401) {
      return false;
    }

    throw error;
  }
}

export type Set = rio.p.TypeFn<typeof set>;

export const set = cache.withCacheEffect(_set, (env, input) => {
  getAssetCache(env).delete(input);
  getAssetMetaCache(env).delete(input.themeId);
});

type SetInput = AssetInput & RequireExactlyOne<SetInputValue, keyof SetInputValue>;

type SetInputValue = {
  readonly value: string;
  readonly attachment: string;
  readonly src: string;
  readonly source_key: string;
};

type SetFetchPayload = {
  asset: AssetMeta;
};

async function _set(env: RestClienEnv, input: SetInput): Promise<AssetMeta> {
  const data = await rest
    .getClient(env)
    .fetch<SetFetchPayload>(`/themes/${gid.getId(input.themeId)}/assets.json`, {
      method: 'PUT',
      body: {
        asset: {
          key: input.key,
          attachment: input.attachment,
          source_key: input.source_key,
          src: input.src,
          value: input.value,
        },
      },
    });

  return data.asset;
}

export type Modify = rio.p.TypeFn<typeof modify>;

export const modify = rio.mapEnv(_modify, rio.sequenceEnv({ get, set }));

type ModifyEnv = rio.RemoveEnvS<{
  get: Get;
  set: Set;
}>;

type ModifyInput = AssetInput & {
  modifyFn: (contents: string) => string;
};

async function _modify(env: ModifyEnv, input: ModifyInput): Promise<AssetMeta> {
  const asset = await env.get(input);

  const { contents, createSetInput } = isWithValue(asset)
    ? {
        contents: asset.value,
        createSetInput: (value: string) => ({ ...input, value }),
      }
    : {
        contents: asset.attachment,
        createSetInput: (attachment: string) => ({ ...input, attachment }),
      };

  const modifiedContents = input.modifyFn(contents);

  if (modifiedContents === contents) {
    return Promise.resolve(asset);
  }

  return env.set(createSetInput(modifiedContents));
}

export type Remove = rio.p.TypeFn<typeof remove>;

export const remove = cache.withCacheEffect(_remove, (env, input) => {
  getAssetCache(env).delete(input);
  getAssetMetaCache(env).delete(input.themeId);
});

async function _remove(env: RestClienEnv, input: AssetInput): Promise<void> {
  await rest
    .getClient(env)
    .fetch(`/themes/${gid.getId(input.themeId)}/assets.json?asset[key]=${input.key}`, {
      method: 'DELETE',
    });
}
