const gestalt = require('../lib/gestalt');
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const { debug } = require('../lib/debug');
exports.command = 'containers'
exports.desc = 'Promote containers'
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

    console.log("Select environment to promote to");
    const targetEnvironment = await ui.selectEnvironment({}, null, context);
    console.log();

    if (!targetEnvironment) {
        console.log("Aborting - no target environment selected");
        return;
    }

    // Ensure different environments were used
    if (targetEnvironment.id == context.environment.id) {
        console.log("Aborting - can't use the same source and destination enviornment");
        return;
    }

    context.target_environment = {
        id: targetEnvironment.id
    };

    const confirmed = await ui.promptToContinue(`Proceed to promote ${selectedContainers.length} container(s)?`, false);
    if (!confirmed) {
        console.log('Aborted.');
        return;
    }

    const promises = selectedContainers.map(container => {
        console.log(`Promoting container '${container.name}'...`)
        return gestalt.promoteContainer(container, context);
    });

    await Promise.all(promises);
    console.log('Done.');
});
