const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inquirer = require('inquirer');
const cmd = require('../lib/cmd-base');

exports.command = 'container [container_name]'
exports.desc = 'Delete container'
exports.builder = {
    force: {
        desc: "Force delete",
        required: false
    }
}
exports.handler = cmd.handler(async function (argv) {

    // fog delete container nginx1

    // Main
    if (argv.container_name) {
        // Command mode

        const context = await cmd.resolveEnvironment();

        const container = await gestalt.fetchContainer({ name: argv.container_name }, context);

        const response = await gestalt.deleteContainer(container, { force: argv.force });
        console.log(`Container '${container.name}' deleted.`);
    } else {

        // Interactive mode

        const context = await ui.resolveEnvironment();

        const containers = await gestalt.fetchContainers(context);
        const container = await ui.selectContainer({}, containers);

        const confirm = await confirmIfNeeded();
        if (confirm) {
            const response = await gestalt.deleteContainer(container, { force: argv.force });
            console.log(`Container '${container.name}' deleted.`);
        } else {
            console.log('Aborted.');
        }
    }
});

function confirmIfNeeded() {
    const questions = [
        {
            message: `Will delete container, are you sure?`,
            type: 'confirm',
            name: 'confirm',
            default: false
        },
    ];

    return inquirer.prompt(questions).then(answers => answers.confirm);
}
