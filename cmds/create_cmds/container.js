const inquirer = require('inquirer');
const gestalt = require('../lib/gestalt')
const gestaltState = require('../lib/gestalt-state');
const selectHierarchy = require('../lib/selectHierarchy');
const selectProvider = require('../lib/selectProvider');
const fs = require('fs');

const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'container'
exports.desc = 'Create container'
exports.builder = {
    template: {
        alias: 't',
        description: 'template file'
    },
    file: {
        alias: 'f',
        description: 'container definition file'
    }
}
exports.handler = cmd.handler(async function (argv) {


    if (argv.file) {
        // load from file
        // Create
        console.log(`Loading container spec from file ${argv.file}`);
        let containerSpec = loadObjectFromFile(argv.file);
        if (argv.template) {
            const template = loadObjectFromFile(argv.template);
            console.log(`Mixing in template: ${template}`);
            containerSpec = Object.assign(template, containerSpec);
        }
        const container = await gestalt.createContainer(containerSpec);
        console.log(`container: ${JSON.stringify(container, null, 2)}`);
        console.log(`Container '${container.name}' created from file ${arg.file}.`);
    } else {

        // Interactive mode
        await selectHierarchy.resolveEnvironment();

        const answers = await promptForInput();

        debug(`answers: ${JSON.stringify(answers, null, 2)}`);

        if (answers.confirm) {

            const containerSpec = Object.assign({}, answers);
            delete containerSpec.confirm;
            containerSpec.properties.container_type = 'DOCKER';

            debug(`containerSpec: ${JSON.stringify(containerSpec, null, 2)}`);

            // Create
            const container = await gestalt.createContainer(containerSpec);
            debug(`container: ${JSON.stringify(container, null, 2)}`);
            console.log(`Container '${container.name}' created.`);
        } else {
            console.log('Aborted.');
        }
    }

    function loadObjectFromFile(filePath) {
        if (fs.existsSync(filePath)) {
            const contents = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(contents);
        }
        throw new Error(`File '${filePath}' not found`);
    }

    async function promptForInput() {

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

        const provider = await selectProvider.run({ type: 'CaaS', message: 'Select Provider', mode: 'list' });

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
                message: "\nProceed to create container?",
                type: 'confirm',
                name: 'confirm',
                default: false
            },
        ];

        return inquirer.prompt(questions).then(answers => {
            answers.properties.provider = {
                id: provider.id
            };
            return answers;
        });
    }
});
