'use strict';
const cmd = require('../lib/cmd-base');
const { gestaltSession } = require('gestalt-fog-sdk');
const chalk = require('../lib/chalk');
exports.command = 'get-browser-url [path]'
exports.desc = 'get-browser-url'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const context = argv.path? await cmd.resolveContextPath(argv.path) : gestaltSession.getContext();
    const url = gestaltSession.getContextBrowserUrl(context);
    console.log(chalk.bold.blue(url));
});

