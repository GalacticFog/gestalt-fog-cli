exports.command = 'provider-containers'
exports.desc = 'List provider containers'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectHierarchy = require('../lib/selectHierarchy');

    selectHierarchy.resolveOrg(() => {

        try {
            const fqon = gestalt.getState().org.fqon;

            const providers = gestalt.fetchOrgProviders([fqon]);

            const arr = [];

            providers.map(provider => {

                provider.short_resource_type = provider.resource_type.replace(/Gestalt::Configuration::Provider::/, '')

                // console.log(provider);
                const containers = gestalt.fetchProviderContainers(provider);
                if (containers.length > 0) {

                    console.log(`Containers for ${provider.name}`);

                    containers.map(c => {
                        let b = gestalt.fetchContainer(c);
                        b.running_instances = `${b.properties.tasks_running}/${b.properties.num_instances}`;
                        if (b.description) {
                            if (b.description.length > 20) {
                                b.description = b.description.substring(0, 20) + '...';
                            }
                        }
                        b.provider = provider;
                        arr.push(b);

                        // console.log(JSON.stringify(b, null, 2));
                    });

                }
            });

            displayProviderContainers(arr);

        } catch (err) {
            console.log(err.message);
            console.log("Try running 'change-context'");
            console.log();
        }
    });

    function displayProviderContainers(containers) {
        const options = {
            message: "Provider Containers",
            headers: ['Provider', 'Type', 'Container', 'Description', 'Status', 'Image', '#', 'Owner', 'FQON', 'ENV', 'ID'],
            fields: ['provider.name', 'provider.short_resource_type', 'name', 'description', 'properties.status', 'properties.image', 'running_instances', 'owner.name', 'org.properties.fqon', 'env.name', 'id'],
            sortField: 'org.properties.fqon',
        }

        displayResource.run(options, containers);
    }
}