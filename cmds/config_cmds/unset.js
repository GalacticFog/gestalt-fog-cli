const cmd = require('../lib/cmd-base');
const gestaltContext = require('../lib/gestalt-context');
const util = require('../lib/util');

exports.command = 'unset'
exports.desc = 'Unset config'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    const args = util.cloneObject(argv._);
    args.shift()
    args.shift()

    // Write config back

    const config = gestaltContext.getConfig();

    // Apply config
    for (let a of args) {
        delete config[a];
    }

    gestaltContext.saveConfig(config);

    console.log(gestaltContext.getConfig());
});
