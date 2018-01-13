exports.command = 'containers'
exports.desc = 'List containers'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectHierarchy = require('../lib/selectHierarchy');
    const options = {
        message: "Containers",
        headers: ['Container', 'Description', 'Status', 'Image', 'Instances', 'Owner'],
        fields: ['name', 'description', 'properties.status', 'properties.image', 'running_instances', 'owner.name'],
        sortField: 'description',
    }

    main();

    async function main() {
        await selectHierarchy.resolveEnvironment();

        const resources = await gestalt.fetchContainers();
        resources.map(item => {
            item.running_instances = `${item.properties.tasks_running} / ${item.properties.num_instances}`
        })

        displayResource.run(options, resources);
    }
}