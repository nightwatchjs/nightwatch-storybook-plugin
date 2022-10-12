const path = require('path');
const fs = require('fs');

const {
  serverRequire,
  normalizeStories
} = require('@storybook/core-common');

const {memo, logger} = require('../utils');

const directoriesToSkip = ['.git', 'node_modules'];
const skipMdx = true;

const resolveStorybookConfig = memo(function(storybookConfigDir) {
  const storybookMainConfig = serverRequire(path.join(path.resolve(storybookConfigDir), 'main'));

  if (!storybookMainConfig) {
    logger.error(`Could not load main.js in ${storybookConfigDir}. Is the config directory correct?`);
  }

  return storybookMainConfig;
});

/**
 * Walks all directories in the project and gathers all files' paths
 * that passes the predicate.
 *
 *
 */
const readFiles = function(directory, shouldInclude = function(filePath) {}) {
  const entries = fs.readdirSync(path.resolve(directory), {
    withFileTypes: true
  });

  return entries
    .filter((dirent) => !directoriesToSkip.includes(dirent.name))
    .flatMap((dirent) => {
      const filePath = path.join(directory, dirent.name);

      if (dirent.isDirectory()) {
        return readFiles(filePath, shouldInclude);
      }

      return shouldInclude(filePath) ? filePath : null;
    })
    .filter(Boolean);
};

const workingDir = process.cwd();

module.exports = memo(function(pluginSettings) {
  const storybookConfig = resolveStorybookConfig(pluginSettings.storybook_config_dir);

  const normalizedStoriesEntries = normalizeStories(storybookConfig.stories, {
    configDir: pluginSettings.storybook_config_dir,
    workingDir
  }).map(specifier => ({
    ...specifier,
    importPathMatcher: new RegExp(specifier.importPathMatcher)
  }));

  return {
    stories: readFiles('.', function(resourcePath) {
      const {ext} = path.parse(resourcePath);
      if (ext === '.mdx' && skipMdx) {
        return false;
      }

      return normalizedStoriesEntries.some(function({importPathMatcher}) {
        return importPathMatcher.test(`./${resourcePath}`);
      });
    }),

    normalizedStoriesEntries
  };
});
