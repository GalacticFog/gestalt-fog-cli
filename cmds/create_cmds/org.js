const cmd = require('../lib/cmd-base');
exports.command = 'org'
exports.desc = 'Create org'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const inquirer = require('inquirer');
    const gestalt = require('../lib/gestalt')
    const gestaltState = require('../lib/gestalt-state');
    const selectHierarchy = require('../lib/selectHierarchy');

    await selectHierarchy.resolveOrg();

    const parent = gestaltState.getState().org;

    debug(`parent: ${JSON.stringify(parent, null, 2)}`);

    promptForInput(answers => {

        debug(`answers: ${answers}`);
        if (answers.confirm) {
            const orgSpec = {
                name: answers.name,
                description: answers.description
            };

            gestalt.createOrg(orgSpec, parent.fqon).then(org => {
                debug(`org: ${org}`);
                console.log(`Org '${org.name}' created.`);
            });
        } else {
            console.log('Aborted.');
        }
    });

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
});