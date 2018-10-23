const inquirer = require('inquirer');
const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'workspace'
exports.desc = 'Create workspace'
exports.builder = {
    'org': {
        alias: 'o',
        description: 'FQON of Org'
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

        // Copy argv properties to workspace spec
        const workspaceSpec = {};
        for (let s of ['name', 'description']) {
            if (!argv[s]) throw Error(`Missing --${s} property`);
            workspaceSpec[s] = argv[s];
        }

        const context = await cmd.resolveOrg(argv);

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