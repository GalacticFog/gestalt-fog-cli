const inquirer = require('inquirer');
const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'workspace [name]'
exports.desc = 'Create workspace'
exports.builder = {
    'org': {
        description: 'FQON or context path of parent org'
    },
    'name': {
        alias: 'n',
        description: 'Workspace name'
    },
    'description': {
        alias: 'd',
        description: 'Workspace description'
    }
}
exports.handler = cmd.handler(async function (argv) {

    if (argv.name) {
        // Command line

        if (!argv.description) throw Error('missing --description');
        // if (!argv.org) throw Error('missing --org');

        // Copy argv properties to workspace spec
        const workspaceSpec = {
            name: argv.name,
            description: argv.description
        };

        let context = null;
        if (argv.org) {
            if (argv.org.startsWith('/')) {
                context = await cmd.resolveContextPath(argv.org);
            } else {
                context = { org: { fqon: argv.org } };
            }
        }
        else {
            context = await cmd.resolveOrg();
        }

        // Create workspace
        const workspace = await gestalt.createWorkspace(workspaceSpec, context);
        console.log(`Workspace '${workspace.name}' created.`);
    } else {

        // Interactive

        const context = await ui.resolveOrg();

        const fqon = context.org.fqon;

        // debug(`parent: ${JSON.stringify(parent, null, 2)}`);

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
                message: "Proceed?",
                type: 'confirm',
                name: 'confirm',
                default: false
            },
        ];

        const answers = await inquirer.prompt(questions);

        debug(`answers: ${answers}`);

        if (answers.confirm) {

            const workspaceSpec = {
                name: answers.name,
                description: answers.description
            };

            const workspace = await gestalt.createWorkspace(workspaceSpec, context);
            debug(`workspace: ${workspace}`);
            console.log(`Workspace '${workspace.name}' created.`);
        } else {
            console.log('Aborted.');
        }
    }
});