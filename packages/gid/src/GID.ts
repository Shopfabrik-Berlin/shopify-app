export type GID<
  NS extends string = string,
  T extends string = string,
  ID extends string = string,
> = `gid://${NS}/${T}/${ID}`;

const GID_RX = /^gid:\/\/([\w-]+)\/([\w-]+)\/([\w-]+)$/;

export function isGid(x: unknown): x is GID {
  return typeof x === 'string' && GID_RX.test(x);
}

export function getId<ID extends string>(gid: GID<string, string, ID>): string {
  return GID_RX.exec(gid)?.[3] ?? '';
}

export const encode =
  <NS extends string>(namespace: NS) =>
  <T extends string>(type: T) =>
  <ID extends string>(id: ID): GID<NS, T, ID> =>
    `gid://${namespace}/${type}/${id}`;
