export { JsonWebTokenError, NotBeforeError, TokenExpiredError } from 'jsonwebtoken';
export type { JwtPayload, VerifyErrors } from 'jsonwebtoken';

import type { ShopOrigin } from '@shopfabrik/shopify-data';
import * as jwt from 'jsonwebtoken';
import type { ApiCredentials } from '../apiCredentials';

export function decode(token: string): jwt.JwtPayload | null {
  try {
    return jwt.decode(token, { json: true });
  } catch {
    return null;
  }
}

export type SignPayload = Record<string, unknown>;

export type SignOptions = Omit<jwt.SignOptions, 'algorithm' | 'audience'> & {
  credentials: ApiCredentials;
  shopOrigin: ShopOrigin;
};

export type SignConfig = {
  credentials: ApiCredentials;
  shopOrigin: ShopOrigin;
  options?: Omit<jwt.SignOptions, 'algorithm' | 'audience'>;
};

const ALGORITHM = 'HS256';

export function sign(config: SignConfig, payload?: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {
        ...payload,
        dest: `https://${config.shopOrigin}`,
      },
      config.credentials.secret,
      {
        ...config.options,
        algorithm: ALGORITHM,
        audience: config.credentials.key,
      },
      (error, token) => {
        if (!error && token) {
          resolve(token);
        } else {
          reject(error);
        }
      },
    );
  });
}

export function verify(credentials: ApiCredentials, token: string): Promise<jwt.JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      credentials.secret,
      {
        algorithms: [ALGORITHM],
        audience: credentials.key,
      },
      (error, payload) => {
        if (!error && payload) {
          resolve(payload);
        } else {
          reject(error);
        }
      },
    );
  });
}
