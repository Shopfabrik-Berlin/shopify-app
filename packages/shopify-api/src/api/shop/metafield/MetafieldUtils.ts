import type { GID } from '@shopfabrik/shopify-data';
import { graphql } from '../../../client';
import type { GraphQLClientEnv } from '../../../client/graphql';
import { rio } from '../../../utils';
import { NotFoundError } from '../../../utils/error';
import type { DecodedMetafield, Metafield } from '../../metafield';
import {
  MetafieldDeleteDocument,
  MetafieldsSetDocument,
  ShopIdDocument,
  ShopMetafieldDocument,
} from './MetafieldUtils.generated';

export type MetafieldUtilsConfig<T> = {
  namespace: string;
  key: string;
  type: string;
  encode: (value: T) => string;
  decode: (value: string) => T | null;
};

export type MetafieldUtils<T> = {
  find: (env: GraphQLClientEnv) => Promise<DecodedMetafield<T> | null>;
  get: (env: GraphQLClientEnv) => Promise<DecodedMetafield<T>>;
  set: (env: GraphQLClientEnv, value: T) => Promise<DecodedMetafield<T>>;
  modify: (env: GraphQLClientEnv, modifyFn: (value?: T) => T) => Promise<DecodedMetafield<T>>;
  delete: (env: GraphQLClientEnv) => Promise<GID | null>;
};

const getShopId = rio.p.map(graphql.rio.fromDocument(ShopIdDocument), (data) => data.shop.id);
const findShopMetafield = rio.p.map(
  graphql.rio.fromDocument(ShopMetafieldDocument),
  (data) => data.shop.metafield,
);
const setMetafields = graphql.rio.fromDocumentWithUserErrors(
  MetafieldsSetDocument,
  (data) => data.metafieldsSet?.userErrors,
  (data) => data.metafieldsSet?.metafields,
);
const deleteMetafield = rio.p.map(
  graphql.rio.fromDocument(MetafieldDeleteDocument),
  (data) => data.metafieldDelete?.deletedId,
);

export function createMetafieldUtils<T>(config: MetafieldUtilsConfig<T>): MetafieldUtils<T> {
  const decodeMetafield = (metafield: Metafield): DecodedMetafield<T> | null => {
    const value = config.decode(metafield.value);
    return value === null ? null : { ...metafield, value };
  };

  const metafieldUtils: MetafieldUtils<T> = {
    find: async (env) => {
      const metafield = await findShopMetafield(env, {
        namespace: config.namespace,
        key: config.key,
      });
      if (!metafield) {
        return null;
      }
      return decodeMetafield(metafield);
    },

    get: async (env) => {
      const metafield = await metafieldUtils.find(env);
      if (!metafield) {
        throw NotFoundError.fromEntity({
          name: 'Metafield',
          id: `${config.namespace}:${config.key}`,
        });
      }
      return metafield;
    },

    set: async (env, value) => {
      const shopId = await getShopId(env, {});
      const metafields = await setMetafields(env, {
        metafields: {
          namespace: config.namespace,
          key: config.key,
          ownerId: shopId,
          type: config.type,
          value: config.encode(value),
        },
      });
      const metafield = decodeMetafield(metafields[0]);
      if (!metafield) {
        throw new Error(
          `Metafield ${config.namespace}:${config.key} failed decoding after being set`,
        );
      }
      return metafield;
    },

    modify: async (env, modifyFn) => {
      const metafield = await metafieldUtils.find(env);
      return metafieldUtils.set(env, modifyFn(metafield?.value));
    },

    delete: async (env) => {
      const metafield = await metafieldUtils.find(env);
      if (!metafield) {
        return null;
      }
      const deletedId = await deleteMetafield(env, { input: { id: metafield.id } });
      return deletedId || null;
    },
  };

  return metafieldUtils;
}
