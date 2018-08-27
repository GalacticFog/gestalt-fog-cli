const gestalt = require('../lib/gestalt');
const ui = require('../lib/gestalt-ui')
const chalk = require('chalk');
const inquirer = require('inquirer');
const cmd = require('../lib/cmd-base');
const { debug } = require('../lib/debug');
exports.command = 'containers'
exports.desc = 'Delete containers'
exports.builder = {
    all: {
        description: 'Delete containers from all environments'
    },
    org: {
        description: 'Delete containers from all environments in current org'
    }
}
exports.handler = cmd.handler(async function (argv) {
    let containers = null;
    if (argv.all) {
        const fqons = await gestalt.fetchOrgFqons();
        containers = await gestalt.fetchOrgContainers(fqons);
    } else if (argv.org) {
        const context = await ui.resolveOrg();
        containers = await gestalt.fetchOrgContainers([context.org.fqon]);
    } else {
        const context = await ui.resolveEnvironment();
        containers = await gestalt.fetchEnvironmentContainers(context);
    }

    if (containers.length == 0) {
        console.log('No containers in current context.');
        return;
    }

    console.log("Select containers to delete (use arrows and spacebar to modify selection)");
    console.log();

    debug(containers);

    const fields = ['name', 'description', 'properties.status', 'properties.image', 'running_instances', 'owner.name', 'org.properties.fqon'];

    const selectedContainers = await ui.selectContainer({ mode: 'checkbox', defaultChecked: false, fields: fields }, containers);
    console.log();

    ui.displayResources(selectedContainers);

    const confirmed = await ui.promptToContinue(`Proceed to delete ${selectedContainers.length} container(s)?`, false);
    if (!confirmed) {
        console.log('Aborted.');
        return;
    }

    const promises = selectedContainers.map(item => {
        console.log(`Deleting container ${item.name}...`)
        return gestalt.deleteContainer(item)
    });

    await Promise.all(promises);
    console.log('Done.');
});
