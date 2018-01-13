exports.command = 'all-containers'
exports.desc = 'List all containers'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');

    main2();

    async function main() {
        process.stdout.write('Reading environments');

        const fqons = await gestalt.fetchOrgFqons();
        const envs = await gestalt.fetchOrgEnvironments(fqons);

        const promises = envs.map(env => {
            process.stdout.write('.');
            const state = {
                org: {
                    fqon: env.org.properties.fqon
                },
                environment: {
                    id: env.id
                }
            }
            return gestalt.fetchContainers(state);
        });

        let containers = await Promise.all(promises);
        containers = [].concat.apply([], containers); // flatten array

        // Transform for display
        containers.map(item => {
            // TODO
            // item.env = { name: env.name };
            // item.fqon = fqon;
            item.running_instances = `${item.properties.tasks_running}/${item.properties.num_instances}`;
            if (item.description) {
                if (item.description.length > 20) {
                    item.description = item.description.substring(0, 20) + '...';
                }
            }
        });

        displayContainers(containers);
    }

    async function main2() {
        process.stdout.write('Reading environments');

        const fqons = await gestalt.fetchOrgFqons();
        const envs = await gestalt.fetchOrgEnvironments(fqons);

        let allContainers = [];

        for (let env of envs) {
            process.stdout.write('.');
            const state = {
                org: {
                    fqon: env.org.properties.fqon
                },
                environment: {
                    id: env.id
                }
            }
            let containers = await gestalt.fetchContainers(state);
            containers.map(item => {
                // TODO
                item.env = { name: env.name };
                item.fqon = env.org.properties.fqon;
                item.running_instances = `${item.properties.tasks_running}/${item.properties.num_instances}`;
                if (item.description) {
                    if (item.description.length > 20) {
                        item.description = item.description.substring(0, 20) + '...';
                    }
                }
            });
            allContainers = allContainers.concat(containers);
        }


        // Transform for display

        displayContainers(allContainers);
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