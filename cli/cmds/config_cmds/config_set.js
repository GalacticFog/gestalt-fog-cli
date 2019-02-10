const cmd = require('../lib/cmd-base');
const { gestaltSession } = require('gestalt-fog-sdk');
const yaml = require('js-yaml');

exports.command = 'set [args...]'
exports.desc = 'Set config'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    if (!argv.args) throw Error('No args specified - nothing to do.');

    const args = argv.args;
    const configArgs = {};

    // Apply config
    for (let a of args) {
        const arg = a.split('=');
        if (arg[1] == undefined) {
            throw Error(`No value specified for '${arg[0]}', use '${arg[0]}=<value>'`)
        } else {
            configArgs[arg[0]] = arg[1];
        }
    }

    // Write config back

    const config = gestaltSession.getGlobalConfig();
    const newConfig = Object.assign(config, configArgs);
    gestaltSession.saveGlobalConfigOptions(newConfig);

    console.log(yaml.dump({ 'Configuration Settings': gestaltSession.getSessionConfig() }));
});
