import type { ShopifyGID } from '@shopfabrik/gid';

export type GID<ID extends string = string> = ShopifyGID<'Theme', ID>;
