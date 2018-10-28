const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inquirer = require('inquirer');
const cmd = require('../lib/cmd-base');

exports.command = 'container [container_name] [provider_path]'
exports.desc = 'Migrate container'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    // fog migrate container nginx1 /root/default-ecs

    // Main
    if (argv.container_name || argv.provider_path) {
        // Command mode

        if (!argv.container_name) throw Error('missing container_name')
        if (!argv.provider_path) throw Error('missing provider_path')

        const context = await cmd.resolveEnvironment();

        const container = await gestalt.fetchContainer({ name: argv.container_name }, context);

        const provider = await cmd.resolveProviderByPath(argv.provider_path);

        context.provider = {
            id: provider.id
        };

        const response = await gestalt.migrateContainer(container, context);
        console.log(`Container '${container.name}' migration initiated.`);
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
