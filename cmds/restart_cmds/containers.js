const cmd = require('../lib/cmd-base');
exports.command = 'containers'
exports.desc = 'Restart containers'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectContainer = require('../lib/selectContainer');
    const selectHierarchy = require('../lib/selectHierarchy');

    await selectHierarchy.resolveEnvironment();
    selectContainer.run({ mode: 'checkbox', defaultChecked: false }, (selectedContainers) => {
        for (let container of selectedContainers) {
            console.log(`Restarting container ${container.name}`);

            // remember scale value
            let instances = container.properties.num_instances;

            // Scale down
            container.properties.num_instances = 0;
            console.log(`Scaling down from ${instances} instances...`);
            gestalt.updateContainer(container).then(() => {
                console.log(`Scaling back up to ${instances} instances...`);

                // Scale up
                container.properties.num_instances = instances;
                gestalt.updateContainer(container).then(() => {
                    console.log('Done.')
                });
            });
        }
    });
});