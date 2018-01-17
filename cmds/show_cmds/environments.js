const gestalt = require('../lib/gestalt')
const displayResource = require('../lib/displayResourceUI');
const selectHierarchy = require('../lib/selectHierarchy');

const cmd = require('../lib/cmd-base');
exports.command = 'environments'
exports.desc = 'List enviornments'
exports.builder = {
    all: {
        description: 'Display all environments in all orgs'
    },
    org: {
        description: 'Display all environments in the current org'
    }
}
exports.handler = cmd.handler(async function (argv) {
    if (argv.all) {
        const options = {
            message: "Environments",
            headers: ['Description', 'Name', 'Org', 'Type', 'Workspace', 'Owner'],
            fields: ['description', 'name', 'org.properties.fqon', 'properties.environment_type', 'properties.workspace.name', 'owner.name'],
            sortField: 'description',
        }

        let fqons = await gestalt.fetchOrgFqons();
        let resources = await gestalt.fetchOrgEnvironments(fqons);
        displayResource.run(options, resources);
    } else if (argv.org) {
        const options = {
            message: "Environments",
            headers: ['Environment', 'Name', 'Type', 'Org', 'Workspace', 'Owner'],
            fields: ['description', 'name', 'properties.environment_type', 'org.properties.fqon', 'properties.workspace.name', 'owner.name'],
            sortField: 'description',
        }

        await selectHierarchy.resolveOrg();
        const resources = await gestalt.fetchOrgEnvironments();
        displayResource.run(options, resources);
    } else {
        const options = {
            message: "Environments",
            headers: ['Environment', 'Name', 'Type', 'Org', 'Workspace', 'Owner'],
            fields: ['description', 'name', 'properties.environment_type', 'org.properties.fqon', 'properties.workspace.name', 'owner.name'],
            sortField: 'description',
        }

        await selectHierarchy.resolveWorkspace();
        const resources = await gestalt.fetchEnvironments();
        displayResource.run(options, resources);
    }
});
