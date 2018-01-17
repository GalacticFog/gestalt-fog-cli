const gestalt = require('../lib/gestalt')
const displayResource = require('../lib/displayResourceUI');
const selectHierarchy = require('../lib/selectHierarchy');

const options = {
    message: "Lambdas",
    headers: ['Lambda', 'Runtime', 'Public', 'FQON', 'Type', 'Owner', 'ID'],
    fields: ['name', 'properties.runtime', 'properties.public', 'org.properties.fqon', 'properties.code_type', 'owner.name', 'id'],
    sortField: 'description',
}

const cmd = require('../lib/cmd-base');
exports.command = 'lambdas'
exports.desc = 'List lambdas'
exports.builder = {
    all: {
        description: 'Display all lambdas in all orgs'
    },
    org: {
        description: 'Display all lambdas in the current org'
    }
}

exports.handler = cmd.handler(async function (argv) {
    if (argv.all) {
        showAllLambdas(argv);
    } else if (argv.org) {
        showOrgLambdas(argv)
    } else {
        showLambdas(argv);
    }
});

async function showLambdas(argv) {
    await selectHierarchy.resolveEnvironment();
    const resources = await gestalt.fetchLambdas();
    displayResource.run(options, resources);
}

async function showAllLambdas(argv) {
    let fqons = await gestalt.fetchOrgFqons();
    let resources = await gestalt.fetchOrgLambdas(fqons);
    displayResource.run(options, resources);
}

async function showOrgLambdas(argv) {
    await selectHierarchy.resolveOrg();
    const resources = await gestalt.fetchOrgLambdas();
    displayResource.run(options, resources);
}