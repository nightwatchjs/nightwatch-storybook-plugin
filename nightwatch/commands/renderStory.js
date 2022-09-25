module.exports = class RenderStoryCommand {

  get storybookUrl() {
    const {storybookUrl} = this.api.globals;

    if (storybookUrl.charAt(storybookUrl.length - 1) === '/') {
      return storybookUrl.substring(0, storybookUrl.length - 1);
    }

    return storybookUrl;
  }

  command(storyId, viewMode, data = {}) {
    this.api
      .navigateTo(this._getStoryUrl(storyId, viewMode))
      .executeAsyncScript(this._getClientScript(), [{
        baseUrl: this.storybookUrl,
        storyId,
        viewMode
      }], (response) => {
        const result = response.value || {};

        if (result.value === null) {
          throw new Error(
            'Could not render the story. Run nightwatch with --devtools and --debug flags (Chrome only) and investigate the error in the browser console.'
          );
        }

        if (result.value && result.value.name === 'StorybookTestRunnerError') {
          throw new Error(result.value.message);
        }

        this.api.assert.ok(!!result.value, `component with storyId ${storyId}.${data.exportName} was rendered successfully.`);
      })
      .pause(this.client.argv.debug ? 0 : 1);

    const {a11yConfig} = data;
    if (a11yConfig) {
      this.api
        .axeInject()
        .axeRun('body', {
          runAssertions: false,
          ...a11yConfig.config
        }, (results) => {
          if (results.error) {
            throw new Error(`Error while running accessibility tests: axeRun(): ${results.error}`);
          }

          const {passes, violations} = results;
          this.client.reporter.setAxeResults({
            passes,
            violations,
            component: `${storyId}.${data.exportName}`
          });
          this.client.reporter.printA11yReport();

          if (results.violations.length > 0) {
            this.api.verify.fail('There are accessibility violations. Please see the complete report for details.');
          }
        });
    }
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

      channel.on(renderedEvent, function() {
        waitFor({
          event: renderedEvent,
          value: getRootChild()
        });
      });

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

      channel.emit('forceRemount', {
        storyId: options.storyId,
        viewMode: options.viewMode
      });
    };
  }

  _getStoryUrl(storyId, viewMode) {
    return `${this.storybookUrl}/iframe.html?viewMode=${viewMode}&id=${storyId}`;
  }
};
