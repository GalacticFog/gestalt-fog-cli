exports.command = 'all-orgs'
exports.desc = 'List all orgs'
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
        for (let r of resources) {
            r.fqon = r.properties.fqon; // for sorting
        }
        displayResource.run(options, resources);
    }
}