exports.command = 'workspace'
exports.desc = 'Create workspace'
exports.builder = {}
exports.handler = function (argv) {

    const inquirer = require('inquirer');
    const gestalt = require('../lib/gestalt')
    const gestaltState = require('../lib/gestalt-state');
    const selectHierarchy = require('../lib/selectHierarchy');

    main();

    async function main() {

        await selectHierarchy.resolveOrg();

        const parent = gestaltState.getState().org;

        debug(`parent: ${JSON.stringify(parent, null, 2)}`);

        promptForInput(answers => {

            debug(`answers: ${answers}`);

            if (answers.confirm) {

                const workspaceSpec = {
                    name: answers.name,
                    description: answers.description
                };

                gestalt.createWorkspace(workspaceSpec, parent.fqon).then(workspace => {
                    debug(`workspace: ${workspace}`);
                    console.log(`Workspace '${workspace.name}' created.`);
                });
            } else {
                console.log('Aborted.');
            }
        });
    }

    function promptForInput(callback) {
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
                message: "Proceed?",
                type: 'confirm',
                name: 'confirm',
                default: false
            },
        ];

        inquirer.prompt(questions).then(answers => {
            callback(answers);
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
}

