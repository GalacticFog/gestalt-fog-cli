const cmd = require('../lib/cmd-base');
exports.command = 'lambdas'
exports.desc = 'List lambdas'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectHierarchy = require('../lib/selectHierarchy');
    const options = {
        message: "Lambdas",
        headers: ['Lambda', 'Runtime', 'Public', 'FQON', 'Type', 'Owner', 'ID'],
        fields: ['name', 'properties.runtime', 'properties.public', 'org.properties.fqon', 'properties.code_type', 'owner.name', 'id'],
        sortField: 'description',
    }

    await selectHierarchy.resolveEnvironment();
    const resources = await gestalt.fetchLambdas();
    displayResource.run(options, resources);
});