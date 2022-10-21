class NightwatchMountError extends Error {
  constructor(message) {
    super(message);

    this.name = 'NightwatchMountError';
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

  getError(message) {
    const err = new NightwatchMountError(message);

    err.showTrace = false;
    err.help = [
      'run nightwatch with --devtools and --debug flags (Chrome only)',
      'investigate the error in the browser console'
    ];

    return err;
  }

  async command(storyId, viewMode, data = {}) {
    const {
      playFnTimeout = 20000,
      playFnRetryInterval = 250
    } = {};

    const {debug, preview} = this.client.argv;
    let renderError;

    const renderErrorResult = await this.api
      .navigateTo(this._getStoryUrl(storyId, viewMode))
      .execute(function(innerHTML) {
        var scriptTag = Object.assign(document.createElement('script'), {
          type: 'module',
          innerHTML
        });
        document.body.appendChild(scriptTag);
      }, [
        `
        const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
        window['@@story_rendered'] = null;
        
        if (channel && channel.data) {
          const errorEvents = channel.data.storyThrewException;
          const storyEvents = channel.data.storyRendered;
          
          if (errorEvents && errorEvents.length > 0) {
            window['@@story_rendered'] = {type: 'error', error: {
              message: errorEvents[0].message,
              stack: errorEvents[0].stack
            }};
          }
          if (storyEvents && storyEvents.length > 0) {
            window['@@story_rendered'] = {type: 'success', story: storyEvents[0]}; 
          } 
        }
        
        channel.on('storyThrewException', function(error) {
          window['@@story_rendered'] = {type: 'error', error: {
            message: error.message,
            stack: error.stack
          }};
        });
  
        channel.on('storyRendered', function(event) {
          window['@@story_rendered'] = {type: 'success', story: event};
        });
        `
      ])
      .waitUntil(async () => {
        const result = await this.api.execute(function() {
          if (window['@@story_rendered']) {
            return window['@@story_rendered'];
          }

          return false;
        });

        let finished = false;
        if (result && result.type) {
          finished = true;
        }

        if (result && result.type === 'error') {
          renderError = new Error('Error while rendering the story: ' + result.error.message);
          renderError.showTrace = false;
        }

        return finished;
      }, playFnTimeout, playFnRetryInterval, `time out reached (${playFnTimeout}ms) while waiting for afterMount() hook to complete.`)
      .perform(function () {
        if (renderError && !(debug || preview)) {
          return true;
        }
      });

    if (renderErrorResult && !(debug || preview)) {
      const err = this.getError('Could not mount the component.');
      err.detailedErr = renderError.message;
      err.message = 'Component mounted with errors';

      return err;
    }

    if (debug) {
      await this.api.debug();
    } else if (preview) {
      await this.api.pause();
    }


    const component = await this.api.executeAsyncScript(this._getClientScript(), [{
      baseUrl: this.storybookUrl,
      storyId,
      viewMode
    }], (response) => {
      const result = response.value || {};

      if (result.value === null) {
        const err = new NightwatchMountError('Could not mount the component story.');

        err.showTrace = false;
        err.help = [
          'run nightwatch with --devtools and --debug flags (Chrome only)',
          'investigate the error in the browser console'
        ];

        return err;
      }

      if (result.value && result.value.name === 'StorybookTestRunnerError') {
        throw new Error(result.value.message);
      }

      this.api.assert.ok(!!result.value, `"${storyId}.${data.exportName}" story was rendered successfully.`);

      const element = this.api.createElement(result.value, {
        isComponent: true
      });
      element.toString = function() {
        return `${storyId}.${data.exportName}`;
      };

      return element;
    });

    const {a11yConfig} = data;
    if (a11yConfig) {
      await this.api
        .axeInject()
        .axeRun('body', {
          runAssertions: a11yConfig.runAssertions || false,
          ...a11yConfig.config
        }, (results) => {
          if (results.error) {
            throw new Error(`Error while running accessibility tests: axeRun(): ${results.error}`);
          }

          const {passes, violations} = results;
          this.client.reporter.setAxeResults({
            verbose: a11yConfig.verbose,
            passes,
            violations,
            component: `${storyId}.${data.exportName}`
          });
          this.client.reporter.printA11yReport();

          if (results.violations.length > 0) {
            const err = new Error('There are accessibility violations; please see the complete report for details.');
            err.showTrace = false;
            err.link = 'https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md';

            this.api.verify.fail(err);
          }
        });
    }

    return component;
  }

  /**
   * Returned function is going to be executed in the browser,
   * so it will have access to the _window_ object.
   */
  _getClientScript() {
    return function(options, done) {
      let stamp = null;

      const renderedEvent = options.viewMode === 'docs' ? 'docsRendered' : 'storyRendered';

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

        const finalStoryUrl = options.baseUrl + '?path=/story/' + options.storyId + '&addonPanel=storybook/interactions/panel';
        const message = '\nAn error occurred in the following story. Access the link for full output:\n' +
          finalStoryUrl + '\n\nMessage:\n ' + errorMessage;

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
        const root = document.querySelector('#root');

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

      channel.on('storyMissing', function(id) {
        if (id === options.storyId) {
          waitFor({
            event: 'storyMissing',
            value: StorybookTestRunnerError('The story was missing when trying to access it.')
          });
        }
      });

      channel.on('playFunctionThrewException', function(error) {
        waitFor({
          event: 'playFunctionThrewException',
          value: StorybookTestRunnerError(error.message)
        });
      });
    };
  }

  _getStoryUrl(storyId, viewMode) {
    return `${this.storybookUrl}/iframe.html?viewMode=${viewMode}&id=${storyId}`;
  }
};
