const EsbuildUtils = require('@nightwatch/esbuild-utils');
const metadata = require('../lib/storybook/metadata.js');
const Csf = require('../lib/storybook/csf.js');

const normalizeExportName = (name) => name.replace(/ /g, '');

module.exports = async function() {
  const storyLocations = metadata().stories;

  // for each location, load the stories and parse the result

  const promises = storyLocations.map((storiesPath) => {
    return Csf.parse(storiesPath)
      .then(stories => {
        // for each story loaded, parse the format
        return stories.map(function(moduleDescription) {
          return {
            id: moduleDescription.id,

            name(exportName) {
              return `"${exportName}" should render`;
            },

            data() {
              return moduleDescription;
            },

            filter(modulePath) {
              return modulePath === moduleDescription.storyPath;
            },

            exports() {
              return stories.map(({name}) => normalizeExportName(name));
            },

            createTest: async function({exportName, data}) {
              const {id, viewMode} = data;

              return async function(browser) {
                await browser.renderStory(id, viewMode, data);
              };
            },

            requireTest(modulePath, options) {
              return EsbuildUtils.run(modulePath, options);
            }
          };
        });
      });
  });

  const result = await Promise.all(promises).then(result => {

    return result.reduce((prev, value) => {
      prev.push(...value);

      return prev;
    }, []);
  });

  return result;
};