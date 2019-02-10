const cmd = require('../lib/cmd-base');
const { gestaltSession } = require('gestalt-fog-sdk');
const util = require('../lib/util');
const yaml = require('js-yaml');

exports.command = 'unset [args...]'
exports.desc = 'Unset config'
exports.builder = {
    all: {
        description: 'Resets all configuration settings'
    }
}
exports.handler = cmd.handler(async function (argv) {
    const config = gestaltSession.getGlobalConfig();

    if (argv.all) {
        // Clear everything
        gestaltSession.saveSessionConfig({});
    } else {
        const args = argv.args;
        if (args) {
            // Apply config
            for (let a of args) {
                delete config[a];
            }
            gestaltSession.saveGlobalConfigOptions(config);
        } else {
            throw Error('No args specified - nothing to do.');
        }
    }

    console.log(yaml.dump({ 'Configuration Settings': gestaltSession.getSessionConfig() }));
});
