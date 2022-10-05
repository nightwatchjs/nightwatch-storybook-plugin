const {run} = require('@nightwatch/esbuild-utils');
const jsdom = require('jsdom');
const path = require('path');
const metadata = require('../lib/storybook/metadata.js');
const Csf = require('../lib/storybook/csf.js');

const normalizeExportName = (name) => name.replace(/ /g, '');

module.exports = function() {
  const storyLocations = metadata().stories;

  // for each location, load the stories and parse the result

  const promises = storyLocations.map(async (storiesPath) => {
    const resolvedPath = path.resolve(storiesPath);
    const stories = await Csf.parse(resolvedPath);

    return {
      storiesPath,

      showBrowserConsole: true,
      name(exportName) {
        const data = stories.find(story => {
          const normalizedName = normalizeExportName(story.name);

          return normalizedName === exportName;
        });

        return `"${data.name}" story`;
      },

      data(exportName) {
        return stories.find(story => {
          const normalizedName = normalizeExportName(story.name);

          return normalizedName === exportName;
        });
      },

      filter(modulePath) {
        return modulePath === resolvedPath;
      },

      exports() {
        return stories.map(({name}) => normalizeExportName(name));
      },

      onlyConditionFn({exportName}, argv = {}) {
        if (!argv.story) {
          return false;
        }

        return exportName.toLowerCase() === argv.story.toLowerCase();
      },

      createTest: async function({exportName, data}) {
        const {id, viewMode} = data;

        return async function(browser) {
          const element = await browser.renderStory(id, viewMode, data);

          return {component: element};
        };
      },

      transformCode(code) {
        const describeRegex = /(describe\(.+\{)+/gm;
        const parts = code.split(describeRegex);
        parts.shift();
        const testCode = parts.join('\n');

        return code;
      },

      requireTest(modulePath, options, {argv, nightwatch_settings}) {
        global.window = (new jsdom.JSDOM('')).window;

        return run(modulePath, options, {argv, nightwatch_settings});
      }
    };
  });

  return Promise.all(promises);
};