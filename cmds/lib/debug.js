const chalk = require('chalk');

exports.debug = debug;

function debug(message, ...optionalParams) {
    if (global.fog.debug) {
        if (typeof message == 'object') {
            console.error(chalk.gray(JSON.stringify(message, null, 2), optionalParams));
        } else {
            console.error(chalk.gray(message, optionalParams));
        }
    }
}
