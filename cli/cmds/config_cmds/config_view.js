const cmd = require('../lib/cmd-base');
const { gestaltContext } = require('gestalt-fog-sdk');
const yaml = require('js-yaml');

exports.command = 'view'
exports.desc = 'view config'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    // Show configuration
    console.log(yaml.dump(gestaltContext.getConfig()));

    // Show supported flags
    console.log('Supported flags:')
    console.log(`
    debug: (true|false) Enables or disables debug mode
    color: (true|false) Enables or disables colors
    interactive: (true|false) Enables / disables interactive prompting
    `);
});
