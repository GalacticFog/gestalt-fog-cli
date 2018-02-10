const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'orgs'
exports.desc = 'List orgs'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    const options = {
        message: "Orgs",
        headers: ['Name', 'FQON', 'Owner'],
        fields: ['description', 'fqon', 'owner.name'],
        sortField: 'fqon',
    }

    const resources = await gestalt.fetchOrgs();
    resources.map(r => {
        r.fqon = r.properties.fqon; // for sorting
    })

    if (argv.raw) {
        console.log(JSON.stringify(resources, null, 2));
    } else {
        ui.displayResource(options, resources);
    }
});
