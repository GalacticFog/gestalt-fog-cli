const { gestalt } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const inquirer = require('inquirer');
const cmd = require('../lib/cmd-base');

exports.command = 'lambda [lambda_name]'
exports.desc = 'Delete lambda'
exports.builder = {
    force: {
        desc: "Force delete",
        required: false
    }
}
exports.handler = cmd.handler(async function (argv) {

    // fog delete lambda test1

    // Main
    if (argv.lambda_name) {
        // Command mode

        const context = await cmd.resolveEnvironment();

        const lambda = await gestalt.fetchLambda({ name: argv.lambda_name }, context);

        const response = await gestalt.deleteLambda(lambda, { force: argv.force });
        console.log(`Lambda '${lambda.name}' deleted.`);
    } else {

        // Interactive mode

        const context = await ui.resolveEnvironment();

        const lambdas = await gestalt.fetchEnvironmentLambdas(context);
        const lambda = await ui.selectLambda({}, lambdas);

        const confirm = await confirmIfNeeded();
        if (confirm) {
            const response = await gestalt.deleteLambda(lambda, { force: argv.force });
            console.log(`Lambda '${lambda.name}' deleted.`);
        } else {
            console.log('Aborted.');
        }
    }
});

function confirmIfNeeded() {
    const questions = [
        {
            message: `Will delete lambda, are you sure?`,
            type: 'confirm',
            name: 'confirm',
            default: false
        },
    ];

    return inquirer.prompt(questions).then(answers => answers.confirm);
}
