export type GID = string & GIDBrand;

export enum GIDBrand {
  _ = '_',
}

const GID_RX = /^gid:\/\/([\w-]+)\/([\w-]+)\/([\w-]+)(?:\?(.*))*$/;

export function is(x: unknown): x is GID {
  return typeof x === 'string' && GID_RX.test(x);
}

export function getId(gid: GID): string {
  return GID_RX.exec(gid)?.[3] ?? '';
}

export class InvalidGidError extends Error {
  readonly gid: string;

  constructor(gid: string) {
    super(`Invalid GID: ${gid}`);

    this.gid = gid;

    Object.defineProperty(this, 'name', { value: 'InvalidGidError' });
  }
}

export const unsafeEncode =
  (namespace: string) =>
  (type: string) =>
  (id: number | string, params?: Readonly<Record<string, string>>): GID => {
    let gid = `gid://${namespace}/${type}/${id}`;

    const _params = new URLSearchParams(params).toString();
    if (_params) {
      gid += `?${_params}`;
    }

    if (!is(gid)) {
      throw new InvalidGidError(gid);
    }

    return gid;
  };
