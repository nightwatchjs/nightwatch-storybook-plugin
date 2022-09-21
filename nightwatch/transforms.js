const nightwatchESbuild = require('nightwatch-esbuild-transform');
const metadata = require('../lib/storybook/metadata.js');
const Csf = require('../lib/storybook/csf.js');

const normalizeExportName = (name) => name.replace(/ /g, '');

module.exports = async function() {
  const storyLocations = metadata().stories;

  // for each location, load the stories and parse the result

  const promises = storyLocations.map((storiesPath) => {
    // load all stories in this location
    return Csf.parse(storiesPath)
      .then(stories => {

        // for each story loaded, parse the format
        return stories.map(function(moduleDescription) {
          return {
            name(exportName) {
              return `"${exportName}" should render`;
            },

            data() {
              return moduleDescription.map(({name, ...rest}) => {
                return {
                  name: normalizeExportName(name),
                  ...rest
                };
              });
            },

            filter(modulePath) {
              return moduleDescription.some(({storyPath}) => {
                return modulePath === storyPath;
              });
            },

            exports() {
              return moduleDescription.map(({name}) => normalizeExportName(name));
            },

            async createTest({exportName, data}) {
              const {id, viewMode} = data.find(({name}) => name === exportName);

              return async function(browser) {
                await browser.renderStory(id, viewMode);
              };
            },

            requireTest(modulePath, options) {
              return nightwatchESbuild.transform(modulePath, options);
            }
          };
        });
      });
  });

  return Promise.all(promises);
};