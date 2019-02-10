const chalkLib = require('chalk');
const { gestaltSession } = require('gestalt-fog-sdk');
const config = gestaltSession.getGlobalConfig();

let chalk = null;

if (config['color'] == 'false') {
    chalk = chalkLib.constructor({ enabled: false });
} else {
    chalk = chalkLib.constructor({ enabled: true });
}

module.exports = chalk;
