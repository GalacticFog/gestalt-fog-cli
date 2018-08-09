'use strict';
const cmd = require('./lib/cmd-base');
const gestaltContext = require('./lib/gestalt-context');
const ui = require('./lib/gestalt-ui');

exports.command = 'status'
exports.desc = 'Show Status'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    // console.log();
    const config = gestaltContext.getConfig();
    const context = gestaltContext.getContext();
    console.log(`Gestalt Endpoint:  ${config.gestalt_url}`);
    console.log(`User:              ${config.username}`);
    console.log('Context:           ' + ui.getContextString(context));
    console.log(`Browser URL:       ${gestaltContext.getBrowserUrl()}`);

    if (argv.all) {
        console.log(JSON.stringify(gestalt.getContext(), null, 2));
    }
    console.log();
});
