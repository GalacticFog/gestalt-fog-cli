const cmd = require('../lib/cmd-base');
const gestaltContext = require('../lib/gestalt-context');
const util = require('../lib/util');

exports.command = 'set'
exports.desc = 'Set config'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    const args = util.cloneObject(argv._);
    args.shift()
    args.shift()

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

    const config = gestaltContext.getConfig();
    const newConfig = Object.assign(config, configArgs);
    gestaltContext.saveConfig(newConfig);

    console.log(gestaltContext.getConfig());
});
