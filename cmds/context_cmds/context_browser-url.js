'use strict';
const cmd = require('../lib/cmd-base');
const gestaltContext = require('../lib/gestalt-context');
exports.command = 'get-browser-url'
exports.desc = 'get-browser-url'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const url = gestaltContext.getBrowserUrl();
    console.log(url);
});

