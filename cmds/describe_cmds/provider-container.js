const cmd = require('../lib/cmd-base');
exports.command = 'provider-container'
exports.desc = 'Describe provider container'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectContainer = require('../lib/selectContainer');
    const selectResource = require('../lib/selectResourceUI');
    const selectHierarchy = require('../lib/selectHierarchy');

    const container = await selectProviderContainers();
    if (argv.raw) {
        delete container.running_instances;
        delete container.provider;
        console.log(JSON.stringify(container, null, 2));
    } else {
        showContainer(container);
        showInstances(container);
    }

    function showContainer(c) {
        const options = {
            message: "Container",
            headers: ['Description', 'Status', 'Name', 'Path', 'Image', 'Instances', 'Owner', 'Provider', 'FQON', 'ID'],
            fields: ['description', 'properties.status', 'name', 'path', 'properties.image', 'properties.num_instances', 'owner.name', 'properties.provider.name', 'org.properties.fqon', 'id'],
            sortField: 'description',
        }

        // console.log()
        // console.log("Container Details:")
        displayResource.run(options, [c]);
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

        displayResource.run(options2, c.properties.instances);
    }

    // function showCommands(c) {
    //     // const envId = gestalt.getCurrentEnvironment().id;

    //     console.log("Commands:")
    //     console.log()
    //     console.log("  Logs:")
    //     console.log()
    //     for (let i in c.properties.instances) {
    //         // console.log(instance)
    //         // console.log(`    ./fog '${c.properties.provider.name}' logs ${envId} ${instance.id} --tail 20 --follow`);
    //         console.log(`    ./container-logs ${c.org.properties.fqon} ${c.id}/${i} --tail 20 --follow`)
    //     }

    //     console.log()
    //     console.log("  Console Access:")
    //     console.log()
    //     for (let i in c.properties.instances) {
    //         // console.log(`    ./fog '${c.properties.provider.name}' console ${envId} ${instance.id} sh`);
    //         console.log(`    ./container-console ${c.org.properties.fqon} ${c.id}/${i}`)
    //     };
    //     console.log()
    // };


    async function selectProviderContainers() {
        await selectHierarchy.resolveOrg();
        const providerContainers = await getProviderContainers();
        let options = {
            mode: 'autocomplete',
            message: "Select Container(s)",
            fields: ['name', 'properties.status', 'properties.image', 'running_instances', 'owner.name', 'properties.provider.name'],
            sortBy: 'name',
            resources: providerContainers
        }

        return selectResource.run(options);
    }

    async function getProviderContainers() {

        const fqon = gestalt.getState().org.fqon;

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
}