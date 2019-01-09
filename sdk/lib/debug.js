const chalk = require('./chalk');

function debug(message, ...optionalParams) {
  if (global.fog && global.fog.debug) {
    if (typeof message == 'object') {
      const str = JSON.stringify(message, null, 2);
      console.error(chalk.dim(str, optionalParams));
    } else {
      console.error(chalk.dim(message, optionalParams));
    }
  }
}

module.exports = {
  debug,
};
