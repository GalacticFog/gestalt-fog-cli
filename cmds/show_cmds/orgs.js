exports.command = 'orgs'
exports.desc = 'List orgs'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');

    const options = {
        message: "Orgs",
        headers: ['Name', 'FQON', 'Owner'],
        fields: ['description', 'fqon', 'owner.name'],
        sortField: 'fqon',
    }

    main();

    async function main() {

        const resources = await gestalt.fetchOrgs();
        resources.map(r => {
            r.fqon = r.properties.fqon; // for sorting
        })

        if (argv.debug) {
            console.log(JSON.stringify(resources, null, 2))
        }

        displayResource.run(options, resources);
    }
}