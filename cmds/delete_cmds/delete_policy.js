const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inquirer = require('inquirer');
const cmd = require('../lib/cmd-base');

exports.command = 'policy [policy_name]'
exports.desc = 'Delete policy'
exports.builder = {
    force: {
        desc: "Force delete",
        required: false
    }
}
exports.handler = cmd.handler(async function (argv) {

    // fog delete policy test1

    // Main
    if (argv.policy_name) {
        // Command mode

        const context = await cmd.resolveEnvironment();

        const policy = await gestalt.fetchPolicy({ name: argv.policy_name }, context);

        const response = await gestalt.deletePolicy(policy, { force: argv.force });
        console.log(`Policy '${policy.name}' deleted. ${response}`);
    } else {

        // Interactive mode

        const context = await ui.resolveEnvironment();

        const policies = await gestalt.fetchPolicies(context);
        const policy = await ui.selectPolicy({}, policies);

        const confirm = await confirmIfNeeded();
        if (confirm) {
            const response = await gestalt.deletePolicy(policy, { force: argv.force });
            console.log(`Policy '${policy.name}' deleted. ${response}`);
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
