const inquirer = require('inquirer');
const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'org'
exports.desc = 'Create org'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    const context = await ui.resolveOrg();

    const parent = context.org;

    debug(`parent: ${JSON.stringify(parent, null, 2)}`);

    const answers = await promptForInput();

    debug(`answers: ${answers}`);
    if (answers.confirm) {
        const orgSpec = {
            name: answers.name,
            description: answers.description
        };

        const org = await gestalt.createOrg(orgSpec, parent.fqon);
        debug(`org: ${org}`);
        console.log(`Org '${org.name}' created.`);
    } else {
        console.log('Aborted.');
    }
});

function promptForInput() {
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

    return inquirer.prompt(questions);
}
