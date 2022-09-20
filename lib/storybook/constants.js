const {name} = require('../../package.json');

// Name of the CLI.
const RUNNER_NAME = module.exports.RUNNER_NAME = name;

// used in logs to mark the origin
const RUNNER_ID = module.exports.RUNNER_ID = `[${RUNNER_NAME}]`;
