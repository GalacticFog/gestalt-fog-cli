exports.command = 'org-containers'
exports.desc = 'List org containers'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectHierarchy = require('../lib/selectHierarchy');

    main();

    async function main() {
        await selectHierarchy.resolveOrg();

        const fqon = gestalt.getCurrentOrg().fqon;

        const envs = await gestalt.fetchOrgEnvironments([fqon]);
        const promises = envs.map(env => {
            console.log(`Fetching containers from ${fqon}/'${env.name}'`);
            const state = {
                org: {
                    fqon: fqon
                },
                environment: {
                    id: env.id
                }
            }
            return gestalt.fetchContainers(state);
        });

        const arr = await Promise.all(promises);
        const containers = [].concat.apply([], arr);

        containers.map(item => {
            // TODO: How to pass environment
            // item.env = { name: env.name };
            item.fqon = fqon;
            item.running_instances = `${item.properties.tasks_running} / ${item.properties.num_instances}`;
        });

        displayContainers(containers);
    }


    function displayContainers(containers) {
        const options = {
            message: "Containers",
            headers: ['Container', 'Description', 'Status', /*'Image',*/ 'Instances', 'Owner', 'FQON', 'ENV'],
            fields: ['name', 'description', 'properties.status', /*'properties.image',*/ 'running_instances', 'owner.name', 'org.properties.fqon', 'env.name'],
            sortField: 'org.properties.fqon',
        }

        displayResource.run(options, containers);
    }
}