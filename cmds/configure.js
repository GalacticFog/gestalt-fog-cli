exports.command = 'configure'
exports.desc = 'Configure'
exports.builder = {}
exports.handler = function (argv) {
    const inquirer = require('inquirer');
    const gestaltState = require('./lib/gestalt-state');

    const config = gestaltState.getConfig();

    const questions = [
        {
            type: 'input',
            name: 'gestalt_url',
            message: "Gestalt URL",
            default: () => {
                return config.gestalt_url || '';
            }
        },
        {
            type: 'input',
            name: 'username',
            message: "Username",
            default: () => {
                return config.username || '';
            }
        },
    ];

    inquirer.prompt(questions).then(answers => {
        if (answers.gestalt_url.indexOf("://") == -1) {
            answers.gestalt_url = 'https://' + answers.gestalt_url;
        }

        gestaltState.saveConfig(answers);

        console.log(`Confguration saved.`);
    });
}