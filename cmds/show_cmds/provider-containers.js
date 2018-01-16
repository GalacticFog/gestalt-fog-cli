const cmd = require('../lib/cmd-base');
exports.command = 'provider-containers'
exports.desc = 'List provider containers'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectHierarchy = require('../lib/selectHierarchy');

    await selectHierarchy.resolveOrg();

    const fqon = gestalt.getState().org.fqon;

    const providers = await gestalt.fetchOrgProviders([fqon]);

    let promises = providers.map(provider => {
        provider.short_resource_type = provider.resource_type.replace(/Gestalt::Configuration::Provider::/, '')
        return gestalt.fetchProviderContainers(provider);
    });

    let containers = await Promise.all(promises);
    containers = [].concat.apply([], containers); // flatten array

    let p2 = containers.map(c => {
        return gestalt.fetchContainer(c);
    });

    for (let c of containers) {
        let b = await gestalt.fetchContainer(c);
    }

    let containers2 = await Promise.all(promises);
    containers2 = [].concat.apply([], containers2); // flatten array

    const arr = [];
    containers2.map(b => {
        b.running_instances = `${b.properties.tasks_running}/${b.properties.num_instances}`;
        if (b.description) {
            if (b.description.length > 20) {
                b.description = b.description.substring(0, 20) + '...';
            }
        }
        b.provider = provider;
        arr.push(b);
    });

    displayProviderContainers(arr);

    function displayProviderContainers(containers) {
        const options = {
            message: "Provider Containers",
            headers: ['Provider', 'Type', 'Container', 'Description', 'Status', 'Image', '#', 'Owner', 'FQON', 'ENV', 'ID'],
            fields: ['provider.name', 'provider.short_resource_type', 'name', 'description', 'properties.status', 'properties.image', 'running_instances', 'owner.name', 'org.properties.fqon', 'env.name', 'id'],
            sortField: 'org.properties.fqon',
        }

        displayResource.run(options, containers);
    }
});