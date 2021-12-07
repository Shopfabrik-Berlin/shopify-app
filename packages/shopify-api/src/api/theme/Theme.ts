import { getDataLoader } from '@dddenis/dataloader-fp';
import { GID, gid } from '@shopfabrik/shopify-data';
import { either, readerTask, task, taskEither } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import type { Option } from 'fp-ts/Option';
import { ClientRestEnv, ClientRestPayload, rest, RestRequestError } from '../../client';

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

type GetRequestPayload = {
  readonly theme: Theme;
};

const dataLoader = getDataLoader<ClientRestEnv, RestRequestError, GID, Theme>({
  batchLoad: (ids) => (env) => {
    return pipe(
      ids,
      task.traverseArray((id) => {
        return pipe(
          env.shopify.client.rest<GetRequestPayload>({
            url: `/themes/${gid.getId(id)}.json`,
            method: 'GET',
          }),
          taskEither.map((payload) => payload.theme),
        );
      }),
      task.map(either.right),
    );
  },
});

export function get(id: GID): ClientRestPayload<Theme> {
  return dataLoader.load(id);
}

export function find(id: GID): ClientRestPayload<Option<Theme>> {
  return pipe(get(id), readerTask.map(rest.error.leftToOption(rest.error.isStatus(404))));
}

type ListRequestPayload = {
  readonly themes: ReadonlyArray<Theme>;
};

const allDataLoader = getDataLoader<ClientRestEnv, RestRequestError, 'all', ReadonlyArray<Theme>>({
  batchLoad: () => (env) => {
    return pipe(
      env.shopify.client.rest<ListRequestPayload>({
        url: '/themes.json',
        method: 'GET',
      }),
      taskEither.map((payload) => {
        payload.themes.forEach((theme) => {
          dataLoader.prime(theme.admin_graphql_api_id)(either.right(theme))(env);
        });

        return [either.right(payload.themes)];
      }),
    );
  },
});

export function list(): ClientRestPayload<ReadonlyArray<Theme>> {
  return allDataLoader.load('all');
}
