import type { GID } from './GID';
import * as gid from './GID';

const SHOPIFY_NS = 'shopify';
type SHOPIFY_NS = typeof SHOPIFY_NS;

export type ShopifyGID<T extends string = string, ID extends string = string> = GID<
  SHOPIFY_NS,
  T,
  ID
>;

export const encode = gid.encode(SHOPIFY_NS);
