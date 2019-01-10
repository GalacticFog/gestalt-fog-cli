'use strict';
const cmd = require('./lib/cmd-base');
const { gestaltContext } = require('gestalt-fog-sdk');
const ui = require('./lib/gestalt-ui');

exports.command = 'status'
exports.desc = 'Show Status'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    // console.log();
    const config = gestaltContext.getConfig();

    if (config.gestalt_url) {
        console.log(`Gestalt Endpoint:  ${config.gestalt_url}`);
        console.log(`User:              ${config.username}`);

        const context = gestaltContext.getContext();

        console.log('Context:           ' + ui.getContextString(context));
        console.log(`Browser URL:       ${gestaltContext.getBrowserUrl()}`);

        if (argv.all) {
            console.log(JSON.stringify(context, null, 2));
        }
    } else {
        console.log('Not logged in.');
    }
    console.log();
});
