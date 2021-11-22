import type { GID } from '@shopfabrik/gid';
import { boolean, monoid, option, readerTaskEither, readonlyArray } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import type { ClientRestPayload } from '../../../client';
import type { Asset } from '../Asset';
import * as asset from '../Asset';
import * as section from '../section';
import * as jsonTemplate from './JsonTemplate';

export type SupportsAppBlocksInput = {
  readonly themeId: GID;
  readonly templateName: string;
};

export function supportsAppBlocks(input: SupportsAppBlocksInput): ClientRestPayload<boolean> {
  return pipe(
    asset.find({
      themeId: input.themeId,
      key: `templates/${input.templateName}.json`,
    }),
    readerTaskEither.chain(
      option.fold(
        () => readerTaskEither.of(false),
        (template) => {
          return assetSupportsAppBlocks({
            themeId: input.themeId,
            template,
          });
        },
      ),
    ),
  );
}

type AssetSupportsAppBlocksInput = {
  readonly themeId: GID;
  readonly template: Asset;
};

function assetSupportsAppBlocks(input: AssetSupportsAppBlocksInput): ClientRestPayload<boolean> {
  return pipe(
    findTemplateMainSectionKeys(input.template),
    readerTaskEither.traverseArray((mainSectionKey) => {
      return section.supportsAppBlocks({
        themeId: input.themeId,
        key: mainSectionKey,
      });
    }),
    readerTaskEither.map(monoid.concatAll(boolean.MonoidAny)),
  );
}

function findTemplateMainSectionKeys(template: Asset): ReadonlyArray<string> {
  return pipe(
    option.fromPredicate(asset.withValueGuard.is)(template),
    option.chainEitherK((template) => jsonTemplate.templateContentDecoder.decode(template.value)),
    option.map((_jsonTemplate) => {
      return pipe(
        Object.entries(_jsonTemplate.sections),
        readonlyArray.filterMap(([id, section]) => {
          return id === 'main' || section.type.startsWith('main-')
            ? option.some(`sections/${section.type}.liquid`)
            : option.none;
        }),
      );
    }),
    option.getOrElse((): ReadonlyArray<string> => []),
  );
}
