import type { Merge } from 'type-fest';
import type { MetafieldFragment } from './Metafield.generated';

export type Metafield = MetafieldFragment;

export type DecodedMetafield<T> = Merge<Metafield, { value: T }>;
