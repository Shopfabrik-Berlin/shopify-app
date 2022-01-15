import type { GID } from '@shopfabrik/shopify-data';
import { rio } from '../../../utils';
import * as asset from '../Asset';
import * as jsonTemplate from './JsonTemplate';

export type IsAppBlockInstalled = rio.p.TypeFn<typeof isAppBlockInstalled>;

export const isAppBlockInstalled = rio.mapEnv(
  _isAppBlockInstalled,
  rio.sequenceEnv({
    findAsset: asset.find,
  }),
);

type IsAppBlockInstalledEnv = rio.RemoveEnvS<{
  findAsset: asset.Find;
}>;

type IsAppBlockInstalledInput = {
  readonly themeId: GID;
  readonly templateName: string;
  readonly blockName: string;
};

async function _isAppBlockInstalled(
  env: IsAppBlockInstalledEnv,
  input: IsAppBlockInstalledInput,
): Promise<boolean> {
  const template = await env.findAsset({
    themeId: input.themeId,
    key: `templates/${input.templateName}.json`,
  });
  if (!template) {
    return false;
  }

  return isAssetAppBlockInstalled({
    template,
    blockName: input.blockName,
  });
}

type IsAssetAppBlockInstalledInput = {
  readonly template: asset.Asset;
  readonly blockName: string;
};

function isAssetAppBlockInstalled(input: IsAssetAppBlockInstalledInput): boolean {
  if (!asset.isWithValue(input.template)) {
    return false;
  }

  const _jsonTemplate = jsonTemplate.decodeContent(input.template.value);
  if (!_jsonTemplate) {
    return false;
  }

  const appBlockRx = createAppBlockRx(input.blockName);

  return Object.values(_jsonTemplate.sections)
    .flatMap((templateSection) => Object.values(templateSection.blocks || {}))
    .some((sectionBlock) => appBlockRx.test(sectionBlock.type));
}

function createAppBlockRx(blockName: string): RegExp {
  return new RegExp(`^shopify://apps/.+?/blocks/${blockName}`);
}
