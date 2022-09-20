const {spawn} = require('child_process');
const path = require('path');
const chalk = require('chalk');
const waitOn = require('wait-on');
const checkStorybook = require('./_utils/checkStorybook.js');

const STORYBOOK_PORT_RE = /(?:localhost|127.0.0.1):(\d+)\/?$/;

let storybookPid = null;

module.exports = {
  async before() {

    const pluginSettings = this.settings['@nightwatch/storybook'];

    let launchUrl = this.settings.launch_url;

    const shouldRunStorybook = Boolean(pluginSettings.start_storybook);

    if (shouldRunStorybook) {
      let storybookPort = pluginSettings.port;

      if (!storybookPort) {
        const [, port = '6006'] = STORYBOOK_PORT_RE.exec(launchUrl) ?? [];

        storybookPort = Number(port);
      }

      // launch_url option can contain a link to the remote Storybook
      // instance. In that case, we should make sure that we are going
      // to run Storybook locally.
      launchUrl = `http://localhost:${storybookPort}`;

      // eslint-disable-next-line no-console
      console.info(`Starting storybook at: ${launchUrl}`);

      storybookPid = spawn(path.resolve('node_modules/.bin/start-storybook'), ['-p', String(storybookPort)], {
        cwd: process.cwd()
      }).pid;

      await waitOn({
        resources: [launchUrl]
      });
    } else {
      const isStorybookRunning = await checkStorybook(launchUrl);

      if (!isStorybookRunning) {
        console.error(
          `Storybook is not running at ${chalk.bold(launchUrl)}.\n\n` +
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
