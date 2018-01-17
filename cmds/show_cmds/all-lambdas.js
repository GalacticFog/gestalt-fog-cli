const cmd = require('../lib/cmd-base');
exports.command = 'all-lambdas'
exports.desc = 'List all lambdas'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');

    const options = {
        message: "Lambdas",
        headers: ['Lambda', 'Runtime', 'Public', 'FQON', 'Type', 'Owner', 'ID'],
        fields: ['name', 'properties.runtime', 'properties.public', 'org.properties.fqon', 'properties.code_type', 'owner.name', 'id'],
        sortField: 'description',
    }

    let fqons = await gestalt.fetchOrgFqons();
    let resources = await gestalt.fetchOrgLambdas(fqons);
    displayResource.run(options, resources);
});