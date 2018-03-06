const inquirer = require('inquirer');
const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'api'
exports.desc = 'Create API'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const context = await ui.resolveEnvironment();

    // Get global GWM provider
    const res = await gestalt.fetchEnvironmentProviders(context, 'GatewayManager');
    if (res.length != 1) throw Error(`Could not get Gateway Manager provider`);
    const gwmProvider = res[0];

    // Get Kong provider
    const kongProvider = await ui.selectProvider({ type: 'Kong', message: 'Select Kong Provider' }, context);

    // User input
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

        const apiSpec = {
            name: answers.name,
            description: answers.description,
            properties: {
                provider: {
                    locations: [kongProvider.id],
                    id: gwmProvider.id
                }
            }
        };

        const api = await gestalt.createApi(apiSpec, context);

        debug(`api: ${api}`);

        console.log(`API '${api.name}' created.`);
    } else {
        console.log('Aborted.');
    }
});