const chalkLib = require('chalk');
const { gestaltContext } = require('gestalt-fog-sdk');
const config = gestaltContext.getConfig();

let chalk = null;

if (config['color'] == 'false') {
    chalk = chalkLib.constructor({ enabled: false });
} else {
    chalk = chalkLib.constructor({ enabled: true });
}

module.exports = chalk;
