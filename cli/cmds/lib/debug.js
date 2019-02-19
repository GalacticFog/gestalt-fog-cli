const chalk = require('./chalk');

module.exports = {
  debug,
  debugError,
  trace
};

function debug(message, ...optionalParams) {
  if (global.fog.debug) {
    if (typeof message == 'object') {
      const str = JSON.stringify(message, null, 2);
      console.error(chalk.dim(str, optionalParams));
    } else {
      console.error(chalk.dim(message, optionalParams));
    }
  }
}

function trace(message, ...optionalParams) {
  if (global.fog.trace) {
    if (typeof message == 'object') {
      const str = JSON.stringify(message, null, 2);
      console.error(chalk.yellow(str, optionalParams));
    } else {
      console.error(chalk.yellow(message, optionalParams));
    }
  }
}

function debugError(error) {
  if (global.fog.debug) {
    console.error(chalk.dim.red(error.stack))
  }
}
