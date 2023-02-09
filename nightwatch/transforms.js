const {run} = require('@nightwatch/esbuild-utils');
const jsdom = require('jsdom');
const path = require('path');
const {logger} = require('../lib/utils');
const metadata = require('../lib/storybook/metadata.js');
const defaultSettings = require('../lib/settings.js');
const Csf = require('../lib/storybook/csf.js');

const normalizeExportName = (name) => name.replace(/ /g, '');

module.exports = function(nightwatch_settings = {}) {
  // for each location, load the stories and parse the result
  const pluginSettings = Object.assign(defaultSettings, nightwatch_settings['@nightwatch/storybook'] || {});
  const storyLocations = metadata(pluginSettings).stories;
  const showBrowserConsole = pluginSettings.show_browser_console;

  const promises = storyLocations.map((storiesPath) => {
    const resolvedPath = path.resolve(storiesPath);

    return Csf.parse(resolvedPath, false, pluginSettings).catch(err => {
      return null;
    }).then(stories => {
      if (stories === null) {
        return null;
      }

      return {
        storiesPath,
        showBrowserConsole,
        name(exportName) {
          const data = stories.find(story => {
            const normalizedName = normalizeExportName(story.exportName);

            return normalizedName === exportName;
          });

          return `"${data.name}" story`;
        },

        data(exportName) {
          return stories.find(story => {
            const normalizedName = normalizeExportName(story.exportName);

            return normalizedName === exportName;
          });
        },

        filter(modulePath) {
          return modulePath === resolvedPath;
        },

        exports(exportNames) {
          return stories.map(story => normalizeExportName(story.exportName));
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
            await browser.perform(() => browser.runA11yTests(id, data));

            return {component: element};
          };
        },

        transformCode(code) {
          return code;
        },

        requireTest(modulePath, options, {argv, nightwatch_settings}) {
          const metadata = stories.find(item => item.storyPath === modulePath) || {};

          const jsdomObject = new jsdom.JSDOM('');
          global.window = jsdomObject.window;
          global.document = jsdomObject.window.document;
          global.navigator = jsdomObject.window.navigator;
          global.HTMLElement = jsdomObject.window.HTMLElement;

          return run(modulePath, options, {argv, nightwatch_settings, id: metadata.id});
        }
      };
    });
  });

  return Promise.all(promises).then(results => {
    const totalNo = results.length;
    const ignoredNo = results.filter(item => item === null).length;

    let hideErrors = '';
    if (!pluginSettings.hide_csf_errors) {
      hideErrors = '\n\tYou can suppress the CSF parsing errors by setting the following in your nightwatch.conf.js:\n' +
        '\t\'@nightwatch/storybook\': {\n' +
        '\t  hide_csf_errors: true\n' +
        '\t}\n';
    }

    if (ignoredNo > 0) {
      logger.info(`Found ${totalNo} total number of story files, of which ${ignoredNo} were ignored due to errors.`);
    }

    if (hideErrors) {
      // eslint-disable-next-line
      console.info(hideErrors);
    }

    return results.filter(item => item !== null);
  });
};