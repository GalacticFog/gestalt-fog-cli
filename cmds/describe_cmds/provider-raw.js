const ui = require('../lib/gestalt-ui');
const cmd = require('../lib/cmd-base');
exports.command = 'provider-raw'
exports.desc = 'Describe provider'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    const context = await ui.resolveOrg();
    const provider = await ui.selectProvider({}, context);
    console.log()
    console.log(JSON.stringify(provider, null, 2));
    console.log()
});