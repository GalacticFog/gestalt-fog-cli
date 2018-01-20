const selectContainer = require('../lib/selectContainer');
const gestalt = require('../lib/gestalt');
const chalk = require('chalk');
const selectHierarchy = require('../lib/selectHierarchy');
const displayResource = require('../lib/displayResourceUI');
const inquirer = require('inquirer');
const cmd = require('../lib/cmd-base');
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
        await selectHierarchy.resolveOrg();
        containers = await gestalt.fetchOrgContainers();
    } else {
        await selectHierarchy.resolveEnvironment();
        containers = await gestalt.fetchContainers();
    }

    if (containers.length == 0) {
        console.log('No containers in current context.');
        return;
    }

    console.log("Select containers to delete (use arrows and spacebar to modify selection)");
    console.log();

    const fields = ['name', 'description', 'properties.status', 'properties.image', 'running_instances', 'owner.name', 'org.properties.fqon', 'environment.name'];

    const selectedContainers = await selectContainer.run({ mode: 'checkbox', defaultChecked: false, fields: fields }, containers);
    console.log();

    displayRunningContainers(selectedContainers);

    const confirmed = await doConfirm();
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

function displayRunningContainers(containers) {

    const options = {
        message: "Containers",
        headers: ['Container', 'Description', 'Status', 'Image', 'Instances', 'Owner', 'FQON', 'ENV'],
        fields: ['name', 'description', 'properties.status', 'properties.image', 'running_instances', 'owner.name', 'org.properties.fqon', 'environment.name'],
        sortField: 'description',
    }

    containers.map(item => {
        item.running_instances = `${item.properties.tasks_running} / ${item.properties.num_instances}`
    })

    displayResource.run(options, containers);
}

function doConfirm() {
    const questions = [
        {
            message: "Proceed?",
            type: 'confirm',
            name: 'confirm',
            default: false // Don't proceed if no user input
        },
    ];

    return inquirer.prompt(questions).then(answers => {
        return answers.confirm;
    });
}
