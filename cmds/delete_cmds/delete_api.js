const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inquirer = require('inquirer');
const cmd = require('../lib/cmd-base');

exports.command = 'api [api_name]'
exports.desc = 'Delete api'
exports.builder = {
    force: {
        desc: "Force delete",
        required: false
    }
}
exports.handler = cmd.handler(async function (argv) {

    // fog delete policy test1

    // Main
    if (argv.api_name) {
        // Command mode

        const context = await cmd.resolveEnvironment();

        const api = await gestalt.fetchApi({ name: argv.api_name }, context);

        const response = await gestalt.deleteApi(api, { force: argv.force });
        console.log(`API '${api.name}' deleted. ${response}`);
    } else {

        // Interactive mode

        const context = await ui.resolveEnvironment();

        const apis = await gestalt.fetchEnvironmentApis(context);
        const api = await ui.selectApi({}, apis);

        const confirm = await confirmIfNeeded();
        if (confirm) {
            const response = await gestalt.deleteApi(api, { force: argv.force });
            console.log(`API '${api.name}' deleted. ${response}`);
        } else {
            console.log('Aborted.');
        }
    }
});

function confirmIfNeeded() {
    const questions = [
        {
            message: `Will delete policy, are you sure?`,
            type: 'confirm',
            name: 'confirm',
            default: false
        },
    ];

    return inquirer.prompt(questions).then(answers => answers.confirm);
}
