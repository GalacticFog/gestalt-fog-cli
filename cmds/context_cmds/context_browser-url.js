'use strict';
const cmd = require('../lib/cmd-base');
const gestaltContext = require('../lib/gestalt-context');
const chalk = require('../lib/chalk');
exports.command = 'get-browser-url [path]'
exports.desc = 'get-browser-url'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const context = argv.path? await cmd.resolveContextPath(argv.path) : gestaltContext.getContext();
    const url = gestaltContext.getBrowserUrl(context);
    console.log(chalk.bold.blue(url));
});

