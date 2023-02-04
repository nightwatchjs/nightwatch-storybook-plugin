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
  const story = await readCsfOrMdx(filePath, {
    makeTitle: makeTitle(filePath, metadata().normalizedStoriesEntries)
  });

  return story.parse();
};

function readParams(obj, acc = {}) {

  if (Array.isArray(obj.properties)) {
    obj.properties.forEach(prop => {
      if (prop.value && prop.key) {
        if (Array.isArray(prop.value.properties)) {

          acc[prop.key.name] = prop.value.properties.reduce((prev, prop) => {
            if (prop.value.value) {
              prev[prop.key.name] = prop.value.value;

              return prev;
            }

            prev[prop.key.name] = prop.value.elements.map((element) => {
              const item = element.properties.reduce((elementPrev, elementProp) => {
                elementPrev[elementProp.key.name] = elementProp.value.value;

                return elementPrev;
              }, {});

              return item;
            });

            return prev;
          }, {});

        } else {
          acc[prop.key.name] = prop.value.value;
        }

      }
    });
  }

  if (acc.config.rules) {
    acc.config.rules = acc.config.rules.reduce((prev, value) => {
      prev[value.id] = value;
      delete prev[value.id].id;

      return prev;
    }, {});
  }

  return acc;
}

module.exports = {
  async parse(storyPath, returnMetaOnly = false, pluginSettings = {}) {
    let csf;

    try {
      csf = await parseCSF(storyPath);
    } catch (error) {
      if (pluginSettings && pluginSettings.hide_csf_errors === false) {
        logger.error(`The "${storyPath}" story contains syntax errors: \n ${error instanceof Error ? error : String(error)}`);
      }

      throw error;
    }

    const parameters = csf._metaAnnotations.parameters || {};
    const title = csf._meta.title;

    if (returnMetaOnly) {
      return {
        title,
        csf
      };
    }

    let a11yConfig = null;

    if (parameters.properties) {
      parameters.properties.some(param => {
        if (param.key && param.key.name === 'a11y') {
          a11yConfig = readParams(param.value);

          return true;
        }

        return false;
      });
    }

    return Object.entries(csf._stories)
      .map(([key, story]) => {
        const {id, name, parameters} = story;

        if (key === '__page') {
          // If key is default, current story is in docs mode, which
          // doesn't have to be tested.
          return null;
        }

        const viewMode = parameters.viewMode || ((Boolean(parameters.docs) && !parameters.docs.disabled) ? 'docs' : 'story');

        return {
          exportName: key,
          id,
          name,
          viewMode,
          a11yConfig,
          storyPath: path.resolve(storyPath)
        };
      });
  }
};
