const cmd = require('../lib/cmd-base');
exports.command = 'container'
exports.desc = 'Create container'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const inquirer = require('inquirer');
    const gestalt = require('../lib/gestalt')
    const gestaltState = require('../lib/gestalt-state');
    const selectHierarchy = require('../lib/selectHierarchy');
    const selectProvider = require('../lib/selectProvider');

    await selectHierarchy.resolveEnvironment();

    promptForInput(answers => {

        debug(`answers: ${JSON.stringify(answers, null, 2)}`);

        if (answers.confirm) {

            const containerSpec = Object.assign({}, answers);
            delete containerSpec.confirm;
            containerSpec.properties.container_type = 'DOCKER';

            debug(`containerSpec: ${JSON.stringify(containerSpec, null, 2)}`);


            // Create
            gestalt.createContainer(containerSpec).then(container => {
                debug(`container: ${JSON.stringify(container, null, 2)}`);
                console.log(`Container '${container.name}' created.`);
            });
        } else {
            console.log('Aborted.');
        }
    });

    function promptForInput(callback) {

        // Provider

        // Name

        // Network

        // -- Resources --
        // Image
        // Num Instances
        // CPU
        // Memory
        // Force Pull

        // Command

        // Description

        // Port Mappings

        // Volumes

        // Secrets

        // Env Vars

        // Labels

        // Health Checks


        // {
        //     "name": "test1",
        //     "properties": {
        //         "env": {
        //         },
        //         "labels": {
        //         },
        //         "volumes": [

        //         ],
        //         "secrets": [

        //         ],
        //         "port_mappings": [

        //         ],
        //         "health_checks": [

        //         ],
        //         "provider": {
        //             "locations": [

        //             ],
        //             "id": "ff2c2f85-fa32-482c-a9e5-e421180f05e3"
        //         },
        //         "container_type": "DOCKER",
        //         "force_pull": false,
        //         "cpus": 0.1,
        //         "memory": 128,
        //         "num_instances": 1,
        //         "network": "BRIDGE",
        //         "image": "nginx"
        //     }
        // }

        selectProvider.run({ type: 'CaaS', message: 'Select Provider', mode: 'list' }, provider => {

            const questions = [
                {
                    message: "Name",
                    type: 'input',
                    name: 'name',
                },
                {
                    message: "Description",
                    type: 'input',
                    name: 'description',
                },
                {
                    message: "Image",
                    type: 'input',
                    name: 'properties.image',
                },
                {
                    message: "Force Pull Image",
                    type: 'confirm',
                    name: 'properties.force_pull',
                    default: true
                },
                {
                    message: "Network",
                    type: 'input',
                    name: 'properties.network',
                    default: "BRIDGE"
                },
                {
                    message: "CPU",
                    type: 'input',
                    name: 'properties.cpus',
                    default: 0.1
                },
                {
                    message: "Memory (MB)",
                    type: 'input',
                    name: 'properties.memory',
                    default: 128
                },
                {
                    message: "Number of instances",
                    type: 'input',
                    name: 'properties.num_instances',
                    default: 1
                },
                {
                    message: "Proceed?",
                    type: 'confirm',
                    name: 'confirm',
                    default: false
                },
            ];

            inquirer.prompt(questions).then(answers => {

                answers.properties.provider = {
                    id: provider.id
                };
                callback(answers);
            });
        });
    }

    function debug(str) {
        if (argv.debug) {
            console.log(typeof str)
            if (typeof str == 'object') {
                console.log('[DEBUG] ' + JSON.stringify(str, null, 2));
            } else {
                console.log('[DEBUG] ' + str);
            }
        }
    }
});
