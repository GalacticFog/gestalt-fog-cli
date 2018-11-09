const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'orgs'
exports.desc = 'List orgs'
exports.builder = {
    output: {
        alias: 'o',
        description: 'json, raw, yaml, list'
    },
    raw: {
        description: 'Show in raw JSON format'
    }
}
exports.handler = cmd.handler(async function (argv) {

    const resources = await gestalt.fetchOrgs();
    resources.map(r => {
        r.fqon = r.properties.fqon; // for sorting
    })

    ui.displayResources(resources, argv, {});
});
