const inquirer = require('inquirer');
const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'environment'
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
        for (let s of ['name', 'description', 'type']) {
            if (!argv[s]) throw Error(`Missing --${s} property`);
        }

        const envSpec = {
            name: argv.name,
            description: argv.description,
            properties: {
                environment_type: argv.type
            }
        };

        const context = gestalt.getContext();

        // Check if org property is required
        if (argv.org) {
            context.org = { fqon: argv.org }
        } else {
            if (!context.org || !context.org.fqon) {
                throw Error(`Missing --org property, not found in current context`);
            }
        }
        console.log(`Using '${context.org.fqon}' org.`)

        // Check if workspace property is required
        if (argv.workspace) {
            context.workspace = {};

            // Look up ID by name
            const orgWorkspaces = await gestalt.fetchOrgWorkspaces([context.org.fqon]);
            for (let ws of orgWorkspaces) {
                if (ws.name == argv.workspace) {
                    // found it
                    context.workspace = {
                        id: ws.id,
                        name: ws.name
                    };
                    break;
                }
            }
            if (!context.workspace.id) throw Error(`Could not find workspace with name '${argv.workspace}'`);
        } else {
            if (!context.workspace || !context.workspace.id) {
                throw Error(`Missing --workspace property, not found in current context`);
            }
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