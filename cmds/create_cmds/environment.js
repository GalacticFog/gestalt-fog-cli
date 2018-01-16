const cmd = require('../lib/cmd-base');
exports.command = 'environment'
exports.desc = 'Create environment'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    const inquirer = require('inquirer');
    const gestalt = require('../lib/gestalt')
    const gestaltState = require('../lib/gestalt-state');
    const selectHierarchy = require('../lib/selectHierarchy');

    await selectHierarchy.resolveWorkspace();

    promptForInput(answers => {

        debug(`answers: ${answers}`);
        if (answers.confirm) {

            const envSpec = {
                name: answers.name,
                description: answers.description,
                properties: {
                    environment_type: answers.environment_type
                }
            };

            gestalt.createEnvironment(envSpec).then(environment => {

                debug(`environment: ${environment}`);

                console.log('Environment created.');
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