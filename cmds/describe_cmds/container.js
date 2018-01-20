const gestalt = require('../lib/gestalt')
const displayResource = require('../lib/displayResourceUI');
const selectContainer = require('../lib/selectContainer');
const selectHierarchy = require('../lib/selectHierarchy');
const cmd = require('../lib/cmd-base');
exports.command = 'container [name]'
exports.desc = 'Describe container'
exports.builder = {
    all: {
        description: 'Describe containers from all environments'
    },
    org: {
        description: 'Describe containers from all environments in current org'
    }
}
exports.handler = cmd.handler(async function (argv) {

    const containerName = argv.name

    let containers = null;
    if (argv.all) {
        const fqons = await gestalt.fetchOrgFqons();
        containers = await gestalt.fetchOrgContainers(fqons);
    } else if (argv.org) {
        await selectHierarchy.resolveOrg();
        containers = await gestalt.fetchOrgContainers();
    } else {
        await selectHierarchy.resolveEnvironment();
        containers = await gestalt.fetchContainers();
    }

    if (containers.length == 0) {
        console.log('No containers in current context.');
        return;
    }

    const container = await selectContainer.run({ name: containerName }, containers);
    if (!container) {
        console.error(`No container '${containerName}' found in the current envrionment.`);
    } else if (argv.raw) {
        console.log(JSON.stringify(container, null, 2));
    } else {
        showContainer(container);

        console.log(`Use '--raw' to see raw JSON output`);
        console.log();
    }
});

function showContainer(c) {
    const options = {
        message: "Container",
        headers: ['Description', 'Status', 'Name', 'Path', 'Image', 'Instances', 'Owner', 'Provider'],
        fields: ['description', 'properties.status', 'name', 'path', 'properties.image', 'properties.num_instances', 'owner.name', 'properties.provider.name'],
        sortField: 'description',
    }

    displayResource.run(options, [c]);

    const options2 = {
        message: "Instances",
        headers: ['Container Instances', 'Host', 'Addresses', 'Ports', 'Started'],
        fields: ['id', 'host', 'ipAddresses', 'ports', 'startedAt'],
        sortField: 'description',
    }

    displayResource.run(options2, c.properties.instances);
}
