exports.command = 'all-containers'
exports.desc = 'List all containers'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');

    try {
        let allContainers = [];

        process.stdout.write('Reading environments');
        gestalt.fetchOrgFqons().map(fqon => {
            const envs = gestalt.fetchOrgEnvironments([fqon]);
            envs.map(env => {
                // console.log(`Fetching containers from ${fqon}/${env.id} (${env.name})`);
                process.stdout.write('.');
                const state = {
                    org: {
                        fqon: fqon
                    },
                    environment: {
                        id: env.id
                    }
                }
                try {
                    const containers = gestalt.fetchContainers(state);

                    // Transform for display
                    containers.map(item => {
                        item.env = { name: env.name };
                        item.fqon = fqon;
                        item.running_instances = `${item.properties.tasks_running}/${item.properties.num_instances}`;
                        if (item.description) {
                            if (item.description.length > 20) {
                                item.description = item.description.substring(0, 20) + '...';
                            }
                        }
                    });

                    allContainers = allContainers.concat(containers);
                } catch (err) {
                    // console.error(`Error: ${err.message}`);
                    // Suppress errors, some internal environments can't be fetched
                }
            });
        });

        displayContainers(allContainers);
    } catch (err) {
        console.log(err.message);
        console.log("Try running 'change-context'");
        console.log();
    }

    function displayContainers(containers) {
        const options = {
            message: "Containers",
            headers: ['Container', 'Description', 'Status', /*'Image',*/ '#', 'Owner', 'FQON', 'ENV'],
            fields: ['name', 'description', 'properties.status', /*'properties.image',*/ 'running_instances', 'owner.name', 'org.properties.fqon', 'env.name'],
            sortField: 'org.properties.fqon',
        }

        displayResource.run(options, containers);
    }
}