import { createAuthUrl, genAuthState } from './createAuthUrl';

describe('flow', () => {
  describe('createAuthUrl', () => {
    it('creates valid auth url', () => {
      const url = createAuthUrl({
        accessMode: 'offline',
        apiKey: 'test-api-key',
        redirectUri: 'https://test.com/callback',
        scopes: ['scopeA', 'scopeB'],
        shopOrigin: 'test.myshopify.com' as never,
        state: 'test-state',
      });

      url.searchParams.sort();

      expect(url.toString()).toBe(
        'https://test.myshopify.com/admin/oauth/authorize?client_id=test-api-key&redirect_uri=https%3A%2F%2Ftest.com%2Fcallback&scope=scopeA%2CscopeB&state=test-state',
      );
    });

    it('creates valid auth url for online access mode', () => {
      const url = createAuthUrl({
        accessMode: 'online',
        apiKey: 'test-api-key',
        redirectUri: 'https://test.com/callback',
        scopes: ['scopeA', 'scopeB'],
        shopOrigin: 'test.myshopify.com' as never,
        state: 'test-state',
      });

      url.searchParams.sort();

      expect(url.toString()).toBe(
        'https://test.myshopify.com/admin/oauth/authorize?client_id=test-api-key&grant_options%5B%5D=per-user&redirect_uri=https%3A%2F%2Ftest.com%2Fcallback&scope=scopeA%2CscopeB&state=test-state',
      );
    });
  });

  describe('genAuthState', () => {
    it('generates random nonce', () => {
      expect(genAuthState()).toHaveLength(32);
    });
  });
});
