import { rio } from '../../../utils';
import * as asset from '../Asset';
import type { SectionSchemaBlock } from './SectionSchema';
import * as sectionSchema from './SectionSchema';

export type SupportsAppBlocks = rio.p.TypeFn<typeof supportsAppBlocks>;

export const supportsAppBlocks = rio.mapEnv(
  _supportsAppBlocks,
  rio.sequenceEnv({
    findAsset: asset.find,
  }),
);

type SupportsAppBlocksEnv = rio.RemoveEnvS<{
  findAsset: asset.Find;
}>;

async function _supportsAppBlocks(
  env: SupportsAppBlocksEnv,
  input: asset.Find['Input'],
): Promise<boolean> {
  const section = await env.findAsset(input);
  return section ? assetSupportsAppBlocks(section) : false;
}

function assetSupportsAppBlocks(section: asset.Asset): boolean {
  if (!asset.isWithValue(section)) {
    return false;
  }

  const schema = sectionSchema.decodeContents(section.value);
  if (!schema) {
    return false;
  }

  return schema.blocks?.some(isAppBlockType) ?? false;
}

const APP_BLOCK_TYPE = '@app';

function isAppBlockType(block: SectionSchemaBlock): boolean {
  return block.type === APP_BLOCK_TYPE;
}
