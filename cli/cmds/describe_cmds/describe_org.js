const { gestalt } = require('gestalt-fog-sdk');
const ui = require('../lib/gestalt-ui');
const cmd = require('../lib/cmd-base');
exports.command = 'org [fqon]'
exports.desc = 'Describe org'
exports.builder = {
    raw: {
        description: 'Raw output'
    },
}
exports.handler = cmd.handler(async function (argv) {

    let fqon = argv.fqon; 
    if (!fqon) {
        let context = await ui.resolveOrg();
        fqon = context.org.fqon;
    }

    const org = await gestalt.fetchOrg(fqon);

    ui.displayResources(org, argv);
});