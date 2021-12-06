import type { GID } from '../GID';
import * as gid from '../GID';

export const NAMESPACE = 'shopify';

export const unsafeEncode: (
  type: string,
) => (id: number | string, params?: Readonly<Record<string, string>>) => GID =
  gid.unsafeEncode(NAMESPACE);
