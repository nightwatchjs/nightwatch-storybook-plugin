const chalk = require('chalk');
const dedent = require('dedent');

const {RUNNER_ID} = require('../storybook/constants.js');

const Level = {
  Info: 'info',
  Error: 'error'
};

const formatMessage = function(messages, values, level) {
  const lines = messages.reduce((prev, currentValue, index) => {
    return prev + currentValue + (values[index] ?? '');
  }, `${Level.Info === level ? chalk.bold(RUNNER_ID) : chalk.bgRedBright.bold(RUNNER_ID)} `);

  return dedent(lines)
    .split('\n')
    .map((line) => {
      return line.includes(RUNNER_ID) ? line : `${''.padStart(RUNNER_ID.length, ' ')} ${line}`;
    })
    .join('\n');
};

const logErrorMessage = function(error) {
  return `${chalk.red(error.name)}: ${chalk.dim(error.message)}.\n` + `Stack trace:\n${error.stack}`;
};

module.exports = {
  info: function(msgs, ...values) {
    // eslint-disable-next-line no-console
    console.log(formatMessage(msgs, values, Level.Info));
  },

  error: function(msgs, ...values) {
    const valueArray = values.map(value => {
      return value instanceof Error ? logErrorMessage(value) : value;
    });

    console.error(formatMessage(msgs, valueArray, Level.Error));
  }
};
