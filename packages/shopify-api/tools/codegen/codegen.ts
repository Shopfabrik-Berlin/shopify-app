import { generate } from '@graphql-codegen/cli';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * TODO: create graphql-codegen plugin for this
 */

type FileOutput = { filename: string; content: string };

async function run(): Promise<void> {
  const files = (await generate(
    {
      cwd: path.join(__dirname, '../../'),
      schema: './tools/schema/schema.json',
      generates: {
        './src/schema.generated.ts': {
          plugins: ['typescript'],
        },

        src: {
          documents: './src/**/*.graphql',
          preset: 'near-operation-file',
          presetConfig: {
            baseTypesPath: 'schema.generated.ts',
          },
          plugins: ['typescript-operations', 'typed-document-node'],
        },
      },
      config: {
        enumsAsConst: true,
        immutableTypes: true,
        preResolveTypes: false,
        useTypeImports: true,
        scalars: {
          ID: '@shopfabrik/gid#GID',
        },
      },
    },
    false,
  )) as ReadonlyArray<FileOutput>;

  await Promise.all(
    files
      .map((file) => ({
        ...file,
        content: processFile(file.content),
      }))
      .map((file) => fs.writeFile(file.filename, file.content, 'utf8')),
  );
}

const FRAGMENTS = ['Metafield', 'Shop'];

const mkTypeRx = (typeName: string): RegExp =>
  new RegExp(
    `export type (\\w+(?:Query|Mutation)) = \\(.*?({ readonly __typename\\?: '${typeName}' })`,
    's',
  );

const DOCUMENT_RX = /export const (\w+ =) ({.*?},\.\.\.(\w+).*?DocumentNode<(\w+).*?);/;

function processFile(content: string): string {
  return FRAGMENTS.reduce((acc, fragmentName) => {
    const typeRx = mkTypeRx(fragmentName);

    if (!typeRx.test(acc)) {
      return acc;
    }

    return acc
      .replace(typeRx, (match, typeName: string, fragment: string) =>
        match
          .replace(typeName, `${typeName}<T1 extends Partial<Types.${fragmentName}>>`)
          .replace(fragment, 'T1'),
      )
      .replace(
        DOCUMENT_RX,
        (match, declaration: string, document: string, fragment: string, queryType: string) =>
          match
            .replace(
              declaration,
              `${declaration} <T1 extends Partial<Types.${fragmentName}>>(${fragment}: DocumentNode<T1>) =>`,
            )
            .replace(document, `(${document})`)
            .replace(queryType, `${queryType}<T1>`),
      );
  }, content);
}

run().catch((reason) => {
  console.error(reason);
  process.exit(1);
});
