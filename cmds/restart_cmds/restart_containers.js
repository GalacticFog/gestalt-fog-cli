const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'containers'
exports.desc = 'Restart containers'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    const context = await ui.resolveEnvironment();
    const containers = await gestalt.fetchContainers(context);
    const selectedContainers = await ui.selectContainer({ mode: 'checkbox', defaultChecked: false }, containers);
    for (let container of selectedContainers) {
        console.log(`Restarting container ${container.name}`);

        // remember scale value
        let instances = container.properties.num_instances;

        // Scale down
        container.properties.num_instances = 0;
        console.log(`Scaling down from ${instances} instances...`);
        await gestalt.updateContainer(container, context);
        console.log(`Scaling back up to ${instances} instances...`);

        // Scale up
        container.properties.num_instances = instances;
        await gestalt.updateContainer(container, context);
        console.log('Done.')
    }
});
