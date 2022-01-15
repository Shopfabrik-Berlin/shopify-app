import type { GID } from '@shopfabrik/shopify-data';
import * as path from 'path';
import * as asset from './Asset';

export type AssetUtilsConfig = {
  remotePath: string;
  getContents: () => Promise<string>;
};

export type AssetUtils = {
  exists: (env: asset.Exists['Env'], themeId: GID) => Promise<boolean>;
  set: (env: asset.Set['Env'], themeId: GID) => Promise<asset.AssetMeta>;
  remove: (env: asset.Remove['Env'], themeId: GID) => Promise<void>;
  renderInHead: (env: asset.Modify['Env'], themeId: GID) => Promise<asset.AssetMeta>;
  removeRenderInHead: (env: asset.Modify['Env'], themeId: GID) => Promise<asset.AssetMeta>;
};

const THEME_PATH = 'layout/theme.liquid';

export function createAssetUtils(config: AssetUtilsConfig): AssetUtils {
  const fileName = path.parse(config.remotePath).name;

  const snippetRx = new RegExp(`{%\\s*(include|render)\\s*['"]${fileName}['"]\\s*%}`);

  const includeSnippetInContents = (contents: string): string => {
    if (snippetRx.test(contents)) {
      return contents;
    }
    return contents.replace('</head>', `{% render '${fileName}' %}</head>`);
  };

  const excludeSnippetFromContents = (contents: string): string => {
    return contents.replace(snippetRx, '');
  };

  return {
    exists: (env, themeId) => {
      return asset.exists(env, {
        themeId,
        key: config.remotePath,
      });
    },

    set: async (env, themeId) => {
      return asset.set(env, {
        themeId,
        key: config.remotePath,
        value: await config.getContents(),
      });
    },

    remove: (env, themeId) => {
      return asset.remove(env, {
        themeId,
        key: config.remotePath,
      });
    },

    renderInHead: (env, themeId) => {
      return asset.modify(env, {
        themeId,
        key: THEME_PATH,
        modifyFn: includeSnippetInContents,
      });
    },

    removeRenderInHead: (env, themeId) => {
      return asset.modify(env, {
        themeId,
        key: THEME_PATH,
        modifyFn: excludeSnippetFromContents,
      });
    },
  };
}
