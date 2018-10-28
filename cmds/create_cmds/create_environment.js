const inquirer = require('inquirer');
const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'environment [name]'
exports.desc = 'Create environment'
exports.builder = {
    'org': {
        alias: 'o',
        description: 'FQON of Org'
    },
    'name': {
        alias: 'n',
        description: 'Environment name'
    },
    'description': {
        alias: 'd',
        description: 'Environment description'
    },
    'type': {
        alias: 't',
        description: 'Environment type'
    },
    'workspace': {
        alias: 'w',
        description: 'Parent workspace'
    }
}
exports.handler = cmd.handler(async function (argv) {

    if (argv.name) {
        // Command line

        // Check for required args
        if (!argv.type) throw Error('missing --type');

        const envSpec = {
            name: argv.name,
            description: argv.description || argv.name,
            properties: {
                environment_type: argv.type
            }
        };

        let context = null;
        if (argv.org || argv.workspace) {

            if (!argv.org) throw Error('missing --org');
            if (!argv.workspace) throw Error('missing --workspace');

            context = await cmd.resolveContextPath(`/${argv.org}/${argv.workspace}`);
        }
        else {
            context = await cmd.resolveWorkspace();
        }

        // Create environment
        const environment = await gestalt.createEnvironment(envSpec, context);
        console.log(`Environment '${environment.name}' created.`);
    } else {
        const context = await ui.resolveWorkspace();

        const questions = [
            {
                message: "Name",
                type: 'input',
                name: 'name',
                validate: inputValidation.resourceName
            },
            {
                message: "Description",
                type: 'input',
                name: 'description',
                validate: inputValidation.resourceDescription
            },
            {
                message: "Type",
                type: 'list',
                name: 'environment_type',
                choices: ['development', 'test', 'production']
            },
            {
                message: "Proceed?",
                type: 'confirm',
                name: 'confirm',
                default: false
            },
        ];

        const answers = await inquirer.prompt(questions);

        debug(`answers: ${answers}`);
        if (answers.confirm) {

            const envSpec = {
                name: answers.name,
                description: answers.description,
                properties: {
                    environment_type: answers.environment_type
                }
            };

            const environment = await gestalt.createEnvironment(envSpec, context);

            debug(`environment: ${environment}`);

            console.log('Environment created.');
        } else {
            console.log('Aborted.');
        }
    }
});