const { gestalt } = require('gestalt-fog-sdk');
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const { debug } = require('../lib/debug');
exports.command = 'containers'
exports.desc = 'Migrate containers'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    let containers = null;
    const context = await ui.resolveEnvironment();
    containers = await gestalt.fetchContainers(context);

    if (containers.length == 0) {
        console.log('No containers in current context.');
        return;
    }

    console.log("Select containers to migrate (use arrows and spacebar to modify selection)");
    console.log();

    debug(containers);

    const fields = ['name', 'description', 'properties.status', 'properties.image', 'running_instances', 'owner.name', 'org.properties.fqon'];

    const selectedContainers = await ui.selectContainer({ mode: 'checkbox', defaultChecked: false, fields: fields }, containers);
    console.log();

    ui.displayResources(selectedContainers);

    console.log("Select provider to migrate to");
    const provider = await ui.selectProvider({ type: 'CaaS', message: 'Select Provider', mode: 'list' }, context);
    context.provider = {
        id: provider.id
    };

    const confirmed = await ui.promptToContinue(`Proceed to migrate ${selectedContainers.length} container(s)?`, false);
    if (!confirmed) {
        console.log('Aborted.');
        return;
    }

    const promises = selectedContainers.map(container => {
        console.log(`Migrating container '${container.name}'...`)
        return gestalt.migrateContainer(container, context);
    });

    await Promise.all(promises);
    console.log('Done.');
});
