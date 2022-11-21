module.exports = class A11yCommand {

  command(storyId, data = {}) {
    const {a11yConfig} = data;

    if (a11yConfig) {
      this.api
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
  }
};
