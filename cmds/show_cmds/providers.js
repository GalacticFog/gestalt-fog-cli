exports.command = 'providers'
exports.desc = 'List providers'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectHierarchy = require('../lib/selectHierarchy');
    const options = {
        message: "Providers",
        headers: ['Provider', 'Description', 'Type', 'Org', 'Owner', 'UID'/*'Created'*/],
        fields: ['name', 'description', 'resource_type', 'org.properties.fqon', 'owner.name', 'id'/*'created.timestamp'*/],
        sortField: 'name',
    }

    main();

    async function main() {

        await selectHierarchy.resolveOrg();

        const fqon = gestalt.getState().org.fqon;

        const resources = await gestalt.fetchOrgProviders([fqon]);

        for (let item of resources) {
            item.resource_type = item.resource_type.replace(/Gestalt::Configuration::Provider::/, '')
            if (item.description) {
                if (item.description.length > 20) {
                    item.description = item.description.substring(0, 20) + '...';
                }
            }
        }

        displayResource.run(options, resources);
    }
}