const { ESLint } = require('eslint');

module.exports = {
  '*.{cjs,js,ts,tsx}': async (files) => lintFiles(await removeIgnoredFiles(files)),
  '*.{cjs,js,json,md,ts,tsx,yaml,yml}': formatFiles,
};

const eslint = new ESLint();

async function removeIgnoredFiles(files) {
  const filteredFiles = await Promise.all(
    files.map(async (file) => ((await eslint.isPathIgnored(file)) ? null : file)),
  );

  return filteredFiles.filter(Boolean);
}

function lintFiles(files) {
  return `pnpm lint:base --fix ${files.join(' ')}`;
}

function formatFiles(files) {
  return `pnpm format:base ${files.join(' ')}`;
}
