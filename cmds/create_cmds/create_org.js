const inquirer = require('inquirer');
const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'org [name]'
exports.desc = 'Create org'
exports.builder = {
    'org': {
        description: 'Parent org FQON for context path'
    },
    'name': {
        alias: 'n',
        description: 'Org name'
    },
    'description': {
        alias: 'd',
        description: 'Org description'
    }
}
exports.handler = cmd.handler(async function (argv) {

    if (argv.name) {
        // Command line

        if (!argv.description) throw Error('missing --description');

        // Copy argv properties to workspace spec
        const orgSpec = {
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

        // Create Org
        const org = await gestalt.createOrg(orgSpec, context.org.fqon);
        console.log(`Org '${org.name}' created.`);
    } else {

        const context = await ui.resolveOrg();

        const parent = context.org;

        debug(`parent: ${JSON.stringify(parent, null, 2)}`);

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
    }
});
