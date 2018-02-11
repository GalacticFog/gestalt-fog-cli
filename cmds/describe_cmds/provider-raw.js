const gestalt = require('../lib/gestalt');
const ui = require('../lib/gestalt-ui');
const cmd = require('../lib/cmd-base');
exports.command = 'provider-raw'
exports.desc = 'Describe provider'
exports.builder = {
    org: {
        description: 'Fetch providers from org'
    },
    workspace: {
        description: 'Fetch providers from workspace'
    },
    type: {
        alias: 't',
        description: 'provider types'
    },
}
exports.handler = cmd.handler(async function (argv) {

    let context = null;
    let resources = null;

    if (argv.org) {
        context = await ui.resolveOrg();
    } else if (argv.workspace) {
        context = await ui.resolveWorkspace();
    } else {
        context = await ui.resolveEnvironment();
    }

    const provider = await ui.selectProvider({}, context);
    console.log()
    console.log(JSON.stringify(provider, null, 2));
    console.log()
});