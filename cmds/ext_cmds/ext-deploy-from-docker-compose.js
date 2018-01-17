'use strict';
exports.command = 'deploy-from-docker-compose'
exports.desc = 'Deploy from Docker Compose file'
exports.builder = {}
exports.handler = function (argv) {
    const dockerComposeParser = require('../lib/gestalt-docker-compose-parser');
    const selectProvider = require('../lib/selectProvider');
    const displayResource = require('../lib/displayResourceUI');
    const selectEnvironment = require('../lib/selectEnvironment');
    const gestalt = require('../lib/gestalt');
    const selectHierarchy = require('../lib/selectHierarchy');
    const chalk = require('chalk');

    // Check for arguments
    if (argv._.length == 0) {
        console.error(`Usage: ${argv['$0']} <docker compose file>`);
        return
    }

    const file = argv._[0];

    const containers = dockerComposeParser.convertFromV3File(file);

    displayContainers(containers);

    // Now, containers need to have an environment and provider assigned

    selectHierarchy.resolveWorkspace(() => {
        selectEnvironment.run({}, (env) => {
            console.log();

            gestalt.setCurrentEnvironment(env);

            selectProvider.run({}, provider => {
                console.log();

                // Assign the provider to each container
                containers.map(item => {
                    item.properties.provider = {
                        id: provider.id,
                    };
                });

                const state = gestalt.getState();

                console.log("Containers will be created in the following location:");
                console.log();
                console.log('    Org:         ' + chalk.bold(`${state.org.description} (${state.org.fqon})`));
                console.log('    Workspace:   ' + chalk.bold(`${state.workspace.description} (${state.workspace.name})`));
                console.log('    Environment: ' + chalk.bold(`${state.environment.description} (${state.environment.name})`));
                console.log('    Provider:    ' + chalk.bold(`${provider.description} (${provider.name})`));
                console.log();

                doConfirm(confirmed => {
                    if (!confirmed) {
                        console.log('Aborted.');
                        return;
                    }

                    const createdContainers = containers.map(item => {
                        console.log(`Creating container ${item.name}`);
                        const container = gestalt.createContainer(item, state);
                        return container;
                    });

                    displayRunningContainers(createdContainers);
                    console.log('Done.');
                });
            });
        });
    });

    function displayContainers(containers) {

        const options = {
            message: "Containers Pending Creation",
            headers: ['Container', 'Description', 'Image', 'CPU', 'Memory (MB)', 'Ports'],
            fields: ['name', 'description', 'properties.image', 'properties.cpus', 'properties.memory', 'ports'],
            sortField: 'description',
        }

        const res = containers.map(item => {
            let r = Object.assign({}, item);
            r.ports = JSON.stringify(r.properties.port_mappings);
            return r;
        });

        displayResource.run(options, res);
    }

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
        const inquirer = require('inquirer');
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