const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inquirer = require('inquirer');
const cmd = require('../lib/cmd-base');

exports.command = 'container [container_name] [env_name]'
exports.desc = 'Promote container'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    // fog promote container nginx1 test

    // Main
    if (argv.container_name || argv.env_name) {
        // Command mode

        if (!argv.container_name) throw Error('missing container_name')
        if (!argv.env_name) throw Error('missing env_name')

        const context = await cmd.resolveEnvironment(argv, gestalt.getContext());

        const container = await gestalt.fetchContainer({ name: argv.container_name }, context);

        const environments = await gestalt.fetchWorkspaceEnvironments(context);
        const targetEnvironment = environments.find(e => e.name == argv.env_name);
        if (targetEnvironment) {
            context.target_environment = {
                id: targetEnvironment.id
            };

            const response = await gestalt.promoteContainer(container, context);
            console.log(`Container '${container.name}' Promotion initiated.`);
        } else {
            throw Error(`Target environment with name '${argv.env_name}' not found.`)
        }
    } else {

        // Interactive mode

        const context = await ui.resolveEnvironment();

        const containers = await gestalt.fetchContainers(context);
        const container = await ui.selectContainer({}, containers);

        const provider = await ui.selectProvider({ type: 'CaaS', message: 'Select Provider', mode: 'list' }, context);

        context.provider = {
            id: provider.id
        };

        const confirm = await confirmIfNeeded();

        if (confirm) {
            const response = await gestalt.migrateContainer(container, context);
            console.log(`Container '${container.name}' migration initiated.`);
        } else {
            console.log('Aborted.');
        }
    }
});

function confirmIfNeeded() {
    const questions = [
        {
            message: `Will migrate container, are you sure?`,
            type: 'confirm',
            name: 'confirm',
            default: false
        },
    ];

    return inquirer.prompt(questions).then(answers => answers.confirm);
}
