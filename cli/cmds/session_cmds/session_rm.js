const cmd = require('../lib/cmd-base');
const { gestaltSession } = require('gestalt-fog-sdk');
const ui = require('../lib/gestalt-ui');

exports.command = 'rm [session]'
exports.desc = 'Removes the session'
exports.builder = {
}
exports.handler = cmd.handler(async function (argv) {
    if (argv.session) {
        gestaltSession.removeSession(argv.session);
    }
});

