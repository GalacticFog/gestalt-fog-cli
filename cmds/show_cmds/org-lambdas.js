exports.command = 'org-lambdas'
exports.desc = 'List org lambdas'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectHierarchy = require('../lib/selectHierarchy');
    const options = {
        message: "Lambdas",
        headers: ['Lambda', 'Runtime', 'Public', 'FQON', 'Type', 'Owner', 'ID'],
        fields: ['name', 'properties.runtime', 'properties.public', 'org.properties.fqon', 'properties.code_type', 'owner.name', 'id'],
        sortField: 'description',
    }

    main();

    async function main() {
        await selectHierarchy.resolveOrg();
        const resources = await gestalt.fetchOrgLambdas();
        displayResource.run(options, resources);
    }
}