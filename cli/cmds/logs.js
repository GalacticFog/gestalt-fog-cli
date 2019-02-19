const { gestalt, gestaltSession } = require('gestalt-fog-sdk')
const cmd = require('./lib/cmd-base');
const ui = require('./lib/gestalt-ui');
const util = require('./lib/util');
const { debug } = require('./lib/debug');
const chalk = require('./lib/chalk');

exports.command = 'logs [type] [instance]';
exports.description = false; //'View logs';
exports.builder = {
}

exports.handler = cmd.handler(async function (argv) {
    const logs = await gestalt.fetchLogs(argv.type, argv.instance);
    console.log(logs);
});
