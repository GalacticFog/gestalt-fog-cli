exports.command = 'containers'
exports.desc = 'Delete containers'
exports.builder = {}
exports.handler = function (argv) {

    const selectContainer = require('../lib/selectContainer');
    const gestalt = require('../lib/gestalt');
    const chalk = require('chalk');
    const selectHierarchy = require('../lib/selectHierarchy');
    const displayResource = require('../lib/displayResourceUI');
    const inquirer = require('inquirer');

    selectHierarchy.resolveEnvironment(() => {

        const containers = gestalt.fetchContainers();

        console.log("Select containers to delete (use arrows and spacebar to modify selection)");
        console.log();

        selectContainer.run({ mode: 'checkbox', defaultChecked: false }, (selectedContainers) => {
            console.log();

            displayRunningContainers(selectedContainers);

            doConfirm(confirmed => {
                if (!confirmed) {
                    console.log('Aborted.');
                    return;
                }

                selectedContainers.map(item => {
                    console.log(`Deleting container ${item.name}`);
                    gestalt.deleteContainer(item);
                });
                console.log('Done.');
            });
        });
    });

    function displayRunningContainers(containers) {

        const options = {
            message: "Containers",
            headers: ['Container', 'Description', 'Status', 'Image', 'Instances', 'Owner'],
            fields: ['name', 'description', 'properties.status', 'properties.image', 'running_instances', 'owner.name'],
            sortField: 'description',
        }

        containers.map(item => {
            item.running_instances = `${item.properties.tasks_running} / ${item.properties.num_instances}`
        })

        displayResource.run(options, containers);
    }


    function doConfirm(callback) {
        const questions = [
            {
                message: "Proceed?",
                type: 'confirm',
                name: 'confirm',
                default: false // Don't proceed if no user input
            },
        ];

        inquirer.prompt(questions).then(answers => {
            callback(answers.confirm);
        });
    }
}