import { getDataLoader } from '@dddenis/dataloader-fp';
import { GID, gid } from '@shopfabrik/shopify-data';
import { either, option, readerTask, readerTaskEither, task, taskEither } from 'fp-ts';
import { constFalse, constTrue, pipe } from 'fp-ts/function';
import type { Option } from 'fp-ts/Option';
import type { Guard } from 'io-ts/Guard';
import type { O } from 'ts-toolbelt';
import { ClientRestEnv, ClientRestPayload, rest, RestRequestError } from '../../client';

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

export const withValueGuard: Guard<Asset, AssetWithValue> = {
  is: (asset): asset is AssetWithValue => 'value' in asset && typeof asset.value === 'string',
};

type ListRequestPayload = {
  readonly assets: ReadonlyArray<AssetMeta>;
};

const assetMetaDataLoader = getDataLoader<
  ClientRestEnv,
  RestRequestError,
  GID,
  ReadonlyArray<AssetMeta>
>({
  batchLoad: (themeIds) => (env) => {
    return pipe(
      themeIds,
      task.traverseArray((themeId) => {
        return pipe(
          env.shopify.client.rest<ListRequestPayload>({
            url: `/themes/${gid.getId(themeId)}/assets.json`,
            method: 'GET',
          }),
          taskEither.map((payload) => payload.assets),
        );
      }),
      task.map(either.right),
    );
  },
});

export function list(themeId: GID): ClientRestPayload<ReadonlyArray<AssetMeta>> {
  return assetMetaDataLoader.load(themeId);
}

type AssetInput = {
  readonly themeId: GID;
  readonly key: string;
};

type GetRequestPayload = {
  readonly asset: Asset;
};

const assetDataLoader = getDataLoader<ClientRestEnv, RestRequestError, AssetInput, Asset, string>({
  batchLoad: (inputs) => (env) => {
    return pipe(
      inputs,
      task.traverseArray((input) => {
        return pipe(
          env.shopify.client.rest<GetRequestPayload>({
            url: `/themes/${gid.getId(input.themeId)}/assets.json?asset[key]=${input.key}`,
            method: 'GET',
          }),
          taskEither.map((payload) => payload.asset),
        );
      }),
      task.map(either.right),
    );
  },
  options: {
    cacheKeyFn: (input) => `${input.themeId}_${input.key}`,
  },
});

export type GetInput = AssetInput;

export function get(input: GetInput): ClientRestPayload<Asset> {
  return assetDataLoader.load(input);
}

export type FindInput = AssetInput;

export function find(input: FindInput): ClientRestPayload<Option<Asset>> {
  return pipe(get(input), readerTask.map(rest.error.leftToOption(rest.error.isStatus(404))));
}

export type ExistsInput = AssetInput;

export function exists(input: ExistsInput): ClientRestPayload<boolean> {
  return pipe(find(input), readerTaskEither.map(option.fold(constFalse, constTrue)));
}

export type SetInput = AssetInput & O.Either<SetRequestInputValue, keyof SetRequestInputValue>;

type SetRequestInput = {
  readonly asset: {
    readonly key: string;
  } & Partial<SetRequestInputValue>;
};

type SetRequestInputValue = {
  readonly value: string;
  readonly attachment: string;
  readonly src: string;
  readonly source_key: string;
};

type SetRequestPayload = {
  readonly asset: AssetMeta;
};

export function set(input: SetInput): ClientRestPayload<AssetMeta, SetRequestInput> {
  return (env) => {
    return pipe(
      env.shopify.client.rest<SetRequestPayload, SetRequestInput>({
        url: `/themes/${gid.getId(input.themeId)}/assets.json`,
        method: 'PUT',
        data: {
          asset: {
            key: input.key,
            attachment: input.attachment,
            source_key: input.source_key,
            src: input.src,
            value: input.value,
          },
        },
      }),
      taskEither.map((payload) => {
        assetMetaDataLoader.clear(input.themeId)(env);

        assetDataLoader.clear({
          themeId: input.themeId,
          key: input.key,
        })(env);

        return payload.asset;
      }),
    );
  };
}

export type ModifyInput = AssetInput;

export function modify(f: (contents: string) => string) {
  return (input: ModifyInput): ClientRestPayload<AssetMeta> => {
    return pipe(
      get(input),
      readerTaskEither.chainW((asset) => {
        if (withValueGuard.is(asset)) {
          return set({
            ...input,
            value: f(asset.value),
          });
        }

        return set({
          ...input,
          attachment: f(asset.attachment),
        });
      }),
    );
  };
}

export type RemoveInput = AssetInput;

export function remove(input: RemoveInput): ClientRestPayload<void> {
  return (env) => {
    return pipe(
      env.shopify.client.rest({
        url: `/themes/${gid.getId(input.themeId)}/assets.json?asset[key]=${input.key}`,
        method: 'DELETE',
      }),
      taskEither.map(() => {
        assetMetaDataLoader.clear(input.themeId)(env);
        assetDataLoader.clear(input);
      }),
    );
  };
}
