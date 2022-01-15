import type { GID } from '@shopfabrik/shopify-data';
import { rio } from '../../../utils';
import * as asset from '../Asset';
import * as section from '../section';
import * as jsonTemplate from './JsonTemplate';

export type SupportsAppBlocks = rio.p.TypeFn<typeof supportsAppBlocks>;

export const supportsAppBlocks = rio.mapEnv(
  _supportsAppBlocks,
  rio.sequenceEnv({
    findAsset: asset.find,
    sectionSupportsAppBlocks: section.supportsAppBlocks,
  }),
);

type SupportsAppBlocksEnv = rio.RemoveEnvS<{
  findAsset: asset.Find;
  sectionSupportsAppBlocks: section.SupportsAppBlocks;
}>;

type SupportsAppBlocksInput = {
  readonly themeId: GID;
  readonly templateName: string;
};

async function _supportsAppBlocks(
  env: SupportsAppBlocksEnv,
  input: SupportsAppBlocksInput,
): Promise<boolean> {
  const template = await env.findAsset({
    themeId: input.themeId,
    key: `templates/${input.templateName}.json`,
  });
  if (!template) {
    return false;
  }

  return assetSupportsAppBlocks(env, {
    themeId: input.themeId,
    template,
  });
}

type AssetSupportsAppBlocksInput = {
  readonly themeId: GID;
  readonly template: asset.Asset;
};

async function assetSupportsAppBlocks(
  env: SupportsAppBlocksEnv,
  input: AssetSupportsAppBlocksInput,
): Promise<boolean> {
  const sectionsAppBlockSupport = await Promise.all(
    findTemplateMainSectionKeys(input.template).map((mainSectionKey) => {
      return env.sectionSupportsAppBlocks({
        themeId: input.themeId,
        key: mainSectionKey,
      });
    }),
  );

  return sectionsAppBlockSupport.some(Boolean);
}

function findTemplateMainSectionKeys(template: asset.Asset): string[] {
  if (!asset.isWithValue(template)) {
    return [];
  }

  const _jsonTemplate = jsonTemplate.decodeContent(template.value);
  if (!_jsonTemplate) {
    return [];
  }

  return Object.entries(_jsonTemplate.sections)
    .filter(([id, section]) => id === 'main' || section.type.startsWith('main-'))
    .map(([, section]) => `sections/${section.type}.liquid`);
}
