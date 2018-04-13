const inquirer = require('inquirer');
const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'org'
exports.desc = 'Create org'
exports.builder = {
    'org': {
        alias: 'o',
        description: 'Parent org fqon'
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

        // Copy argv properties to workspace spec
        const orgSpec = {};
        for (let s of ['name', 'description']) {
            if (!argv[s]) throw Error(`Missing --${s} property`);
            orgSpec[s] = argv[s];
        }

        // Check if org property is required
        let parentOrg = argv.org;
        if (!parentOrg) {
            const context = gestalt.getContext();
            if (!context.org || !context.org.fqon) {
                throw Error(`Missing --org property, not found in current context`);
            } else {
                console.log(`Using '${context.org.fqon}' org.`)
            }
        }

        // Create Org
        const org = await gestalt.createOrg(orgSpec, parentOrg);
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
