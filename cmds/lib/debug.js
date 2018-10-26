const chalk = require('./chalk');

function debug(message, ...optionalParams) {
  if (global.fog.debug) {
    if (typeof message == 'object') {
      const str = JSON.stringify(message, null, 2);
      console.error(chalk.gray(str, optionalParams));
    } else {
      console.error(chalk.gray(message, optionalParams));
    }
  }
}

module.exports = {
  debug,
};
