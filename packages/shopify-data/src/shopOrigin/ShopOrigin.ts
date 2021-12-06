export type ShopOrigin = string & ShopOriginBrand;

export enum ShopOriginBrand {
  _ = '',
}

const SHOP_ORIGIN_RX = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.(com|io)$/;

export function is(x: unknown): x is ShopOrigin {
  return typeof x === 'string' && SHOP_ORIGIN_RX.test(x);
}
