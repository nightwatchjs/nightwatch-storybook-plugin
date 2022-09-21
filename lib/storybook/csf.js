const path = require('path');
const {userOrAutoTitle} = require('@storybook/store');
const {readCsfOrMdx} = require('@storybook/csf-tools');

const metadata = require('./metadata.js');
const {logger} = require('../utils');

const makeTitle = function(filePath, storiesSpecifier) {
  return function(userTitle) {
    return userOrAutoTitle(path.basename(filePath), storiesSpecifier, userTitle);
  };
};

const parseCSF = async function(filePath) {
  try {
    const story = await readCsfOrMdx(filePath, {
      makeTitle: makeTitle(filePath, metadata().normalizedStoriesEntries)
    });

    return story.parse();
  } catch (error) {
    logger.error(`
			The "${filePath}" story contains a syntax error.
			
			${error instanceof Error ? error : String(error)}
		`);
  }
};

module.exports = {
  async parse(storyPath) {
    const csf = await parseCSF(storyPath);

    return Object.entries(csf._stories)
      .map(([key, {id, name, parameters}]) => {

        if (key === '__page') {
          // If key is default, current story is in docs mode, which
          // doesn't have to be tested.
          return null;
        }

        const viewMode = parameters.viewMode ?? ((Boolean(parameters.docs) && !parameters.docs.disabled) ? 'docs' : 'story');

        return {
          id,
          name,
          viewMode,
          storyPath: path.resolve(storyPath)
        };
      });
  }
};
