const {spawn} = require('child_process');
const path = require('path');
const chalk = require('chalk');
const waitOn = require('wait-on');
const checkStorybook = require('./_utils/checkStorybook.js');
const metadata = require('../lib/storybook/metadata.js');

const STORYBOOK_PORT_RE = /(?:localhost|127.0.0.1):(\d+)\/?$/;

let storybookPid = null;

const getStorybookUrl = function() {
  const pluginSettings = Object.assign({
    start_storybook: false,
    storybook_url: 'http://localhost:6006/'
  }, this.settings['@nightwatch/storybook']);


  return pluginSettings.storybook_url;
};

module.exports = {
  beforeEach() {
    // child processes don't have access to the context from the before() hook
    this.storybookUrl = getStorybookUrl.call(this);

    this.component_tests_mode = true;
  },

  async before(settings) {
    this.component_tests_mode = true;

    settings.src_folders = settings.src_folders || [];

    if (settings.src_folders.length === 0) {
      const stories = metadata().normalizedStoriesEntries.filter(entry => {
        return !entry.files.endsWith('.mdx');
      });

      settings.src_folders.push(...stories.map(entry => {
        return path.join(entry.directory, entry.files);
      }));
    }

    const pluginSettings = Object.assign({
      start_storybook: false,
      storybook_url: 'http://localhost:6006/'
    }, this.settings['@nightwatch/storybook']);

    let storybookUrl = pluginSettings.storybook_url;
    const [, port = '6006'] = STORYBOOK_PORT_RE.exec(storybookUrl) || [];
    const storybookPort = Number(port);

    this.storybookUrl = storybookUrl;

    const shouldRunStorybook = Boolean(pluginSettings.start_storybook);

    if (shouldRunStorybook) {
      storybookUrl = `http://localhost:${storybookPort}`;

      // eslint-disable-next-line no-console
      console.info(chalk.dim(` Starting storybook at: ${storybookUrl}...`));

      storybookPid = spawn(path.resolve('node_modules/.bin/start-storybook'), ['--no-open', '-p', String(storybookPort)], {
        cwd: process.cwd()
      }).pid;

      await waitOn({
        resources: [storybookUrl]
      });

      // eslint-disable-next-line no-console
      console.info(chalk.dim(' ℹ Storybook running.'));

    } else {
      const isStorybookRunning = await checkStorybook(storybookUrl);

      if (!isStorybookRunning) {
        // eslint-disable-next-line
        console.warn(
          `Storybook is not running at ${chalk.bold(storybookUrl)}.\n\n` +
          'You can configure Nightwatch to start it for you:\n\n' +
          chalk.bold.gray(
            '\tplugins: [\'@nightwatch/storybook\'],\n\n' +
            '\t\'@nightwatch/storybook\': {\n' +
            '\t  start_storybook: true,\n' +
            '\t  port: 6006 // default\n' +
            '\t}'
          )
        );
        process.exit(1);
      }
    }
  },

  async after() {
    if (storybookPid) {
      process.kill(storybookPid);
    }
  }
};
