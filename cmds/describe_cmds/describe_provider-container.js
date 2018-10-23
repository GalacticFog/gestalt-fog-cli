const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const selectResource = require('../lib/selectResourceUI');
const cmd = require('../lib/cmd-base');
exports.command = 'provider-container'
exports.desc = 'Describe provider container'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    let context = null;
    let container = null;
    
    if (argv.org) {
        context = await ui.resolveOrg();
    } else if (argv.workspace) {
        context = await ui.resolveWorkspace();
    } else {
        context = await ui.resolveEnvironment();
    }

    container = await selectProviderContainers(context);

    if (container) {
        if (argv.raw) {
            delete container.running_instances;
            delete container.provider;
            console.log(JSON.stringify(container, null, 2));
        } else {
            showContainer(container);
            showInstances(container);
        }
    } else {
        console.log('No container selected.');
    }
});

function showContainer(c) {
    ui.displayResources([c]);
}

function showInstances(c) {

    const options2 = {
        message: "Instances",
        headers: ['Container Instances', 'Host', 'Addresses', 'Ports', 'Started'],
        fields: ['id', 'host', 'ipAddresses', 'ports', 'startedAt'],
        sortField: 'description',
    }

    // console.log()
    // console.log("Container Instances:")

    ui.displayResource(options2, c.properties.instances);
}

async function selectProviderContainers(context) {
    const providerContainers = await getProviderContainers(context);
    let options = {
        mode: 'autocomplete',
        message: "Select Container(s)",
        fields: ['name', 'properties.status', 'properties.image', 'running_instances', 'owner.name', 'properties.provider.name'],
        sortBy: 'name',
        resources: providerContainers
    }

    return selectResource.run(options);
}

async function getProviderContainers(context) {

    const fqon = context.org.fqon;

    const providers = await gestalt.fetchOrgProviders([fqon]);

    const arr = [];

    for (let provider of providers) {

        provider.short_resource_type = provider.resource_type.replace(/Gestalt::Configuration::Provider::/, '')

        // console.log(provider);
        const containers = await gestalt.fetchProviderContainers(provider);
        if (containers.length > 0) {

            console.log(`Containers for ${provider.name}`);

            for (let c of containers) {
                let b = await gestalt.fetchContainer(c);
                b.running_instances = `${b.properties.tasks_running}/${b.properties.num_instances}`;
                if (b.description) {
                    if (b.description.length > 20) {
                        b.description = b.description.substring(0, 20) + '...';
                    }
                }
                b.provider = provider;
                arr.push(b);

                // console.log(JSON.stringify(b, null, 2));
            }
        }
    }
    return arr;
}
