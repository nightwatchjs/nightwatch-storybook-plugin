const path = require('path');
const Csf = require('../../lib/storybook/csf.js');

class NightwatchAssertError extends Error {
  constructor(message) {
    super(message);

    this.name = 'NightwatchAssertError';
  }
}

module.exports = class RenderStoryCommand {

  get storybookUrl() {
    const pluginSettings = Object.assign({
      start_storybook: false,
      storybook_url: 'http://localhost:6006/'
    }, this.client.settings['@nightwatch/storybook']);

    const storybookUrl = pluginSettings.storybook_url;

    if (this.client.settings.live_url) {
      return `${this.client.settings.live_url}&url=http://localhost:6006`;
    }


    if (storybookUrl.charAt(storybookUrl.length - 1) === '/') {
      return storybookUrl.substring(0, storybookUrl.length - 1);
    }

    return storybookUrl;
  }

  getError(message = 'Could not mount the component story.') {
    const err = new NightwatchAssertError(message);

    err.showTrace = false;
    err.help = [
      'run nightwatch with --devtools and --debug flags (Chrome only)',
      'investigate the error in the browser console'
    ];

    return err;
  }

  async command(storyModulePath, callback = function(e) {return e}) {
    const storyFileUrl = await this.getStoryFileUrl(storyModulePath);

    if (!storyFileUrl) {
      throw this.getError();
    }

    await this.api.navigateTo(storyFileUrl);

    if (this.client.argv.debug) {
      await this.api.debug();
    } else if (this.client.argv.preview) {
      await this.api.pause();
    }

    const component = await this.api.frame('storybook-preview-iframe').executeAsyncScript(this._getClientScript(), [{
      baseUrl: this.storybookUrl
    }], (response) => {
      const result = response.value || {};

      if (result.value === null) {
        return this.getError();
      }

      if (result.value && result.value.name === 'StorybookTestRunnerError') {
        throw new Error(result.value.message);
      }

      const element = this.api.createElement(result.value, {
        isComponent: true
      });

      return element;
    });

    return component;
  }

  /**
   * Returned function is going to be executed in the browser,
   * so it will have access to the _window_ object.
   */
  _getClientScript() {
    return function(options, done) {
      let stamp = null;

      console.log('_getClientScript', options);
      const renderedEvent = 'docsRendered';

      function waitFor(result) {
        if (result.value === null || result.value.name === 'StorybookTestRunnerError') {
          done(result);

          return;
        }

        if (stamp !== null) {
          clearTimeout(stamp);
        }

        stamp = setTimeout(function() {
          done(result);
        }, 100);
      }

      function StorybookTestRunnerError(errorMessage) {
        const name = 'StorybookTestRunnerError';
        const message = '\nAn error occurred while mounting the component story file:\n ' + errorMessage;

        return {
          name: name,
          message: message
        };
      }

      // eslint-disable-next-line no-undef
      const channel = window.__STORYBOOK_ADDONS_CHANNEL__;

      if (!channel) {
        throw StorybookTestRunnerError('The test runner could not access the Storybook channel.');
      }

      function getRootChild() {
        // eslint-disable-next-line no-undef
        const root = document.querySelector('#docs-root');

        console.log('getRootChild', root)
        if (!root) {
          return null;
        }

        return root.firstElementChild;
      }

      stamp = setTimeout(function() {
        done({
          event: renderedEvent,
          value: getRootChild()
        });
      }, 200);

      channel.on('storyUnchanged', function() {
        waitFor({
          event: 'storyUnchanged',
          value: getRootChild()
        });
      });

      channel.on('storyErrored', function(error) {
        waitFor({
          event: 'storyErrored',
          value: StorybookTestRunnerError(error.description)
        });
      });

      channel.on('storyThrewException', function(error) {
        waitFor({
          event: 'storyThrewException',
          value: StorybookTestRunnerError(error.message)
        });
      });

      channel.on('playFunctionThrewException', function(error) {
        waitFor({
          event: 'playFunctionThrewException',
          value: StorybookTestRunnerError(error.message)
        });
      });
    };
  }

  async getStoryFileUrl(storyModulePath) {
    const data = await Csf.parse(path.join(process.cwd(), storyModulePath), true);
    if (data && data.title) {
      const title = data.title.toLowerCase().replace('/', '-');

      return `${this.storybookUrl}/?path=/docs/${title}`;
    }

    return null;
  }
};
