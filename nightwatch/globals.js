const {spawn} = require('child_process');
const path = require('path');
const chalk = require('chalk');
const waitOn = require('wait-on');
const checkStorybook = require('./_utils/checkStorybook.js');

const STORYBOOK_PORT_RE = /(?:localhost|127.0.0.1):(\d+)\/?$/;

let storybookPid = null;

module.exports = {
  async before() {

    const pluginSettings = Object.assign({
      start_storybook: false,
      storybook_url: 'http://localhost:6006/'
    }, this.settings['@nightwatch/storybook']);

    let storybookUrl = pluginSettings.storybook_url;
    let storybookPort = pluginSettings.port;
    if (!storybookPort) {
      const [, port = '6006'] = STORYBOOK_PORT_RE.exec(storybookUrl) ?? [];

      storybookPort = Number(port);
    }

    this.storybookUrl = storybookUrl;
    const shouldRunStorybook = Boolean(pluginSettings.start_storybook);

    if (shouldRunStorybook) {
      storybookUrl = `http://localhost:${storybookPort}`;

      // eslint-disable-next-line no-console
      console.info(`Starting storybook at: ${storybookUrl}`);

      storybookPid = spawn(path.resolve('node_modules/.bin/start-storybook'), ['-p', String(storybookPort)], {
        cwd: process.cwd()
      }).pid;

      const result = await waitOn({
        resources: [storybookUrl]
      });

    } else {
      const isStorybookRunning = await checkStorybook(storybookUrl);

      if (!isStorybookRunning) {
        console.error(
          `Storybook is not running at ${chalk.bold(storybookUrl)}.\n\n` +
          'You can configure Nightwatch to start it for you:\n\n' +
          chalk.bold.gray(
            '\tplugins: [\'@nightwatch/storybook\'],\n' +
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
