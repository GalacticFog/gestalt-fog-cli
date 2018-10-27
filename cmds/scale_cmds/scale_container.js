const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inquirer = require('inquirer');
const cmd = require('../lib/cmd-base');

exports.command = 'container [container_name] [num_instances]'
exports.desc = 'Scale container'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    // fog migrate container nginx1 /root/default-ecs

    // Main
    if (argv.container_name || argv.num_instances) {
        // Command mode

        if (!argv.container_name) throw Error('missing container_name')
        if (!argv.num_instances) throw Error('missing num_instances')

        const context = await cmd.resolveEnvironment(argv, gestalt.getContext());

        validate(argv.num_instances);

        const container = await gestalt.fetchContainer({ name: argv.container_name }, context);

        container.properties.num_instances = argv.num_instances;
        const response = await gestalt.updateContainer(container);
        console.log(`Container '${container.name}' scale to ${argv.num_instances} initiated.`);
    } else {

        // Interactive mode

        const context = await ui.resolveEnvironment();
        const containers = await gestalt.fetchContainers(context);

        let options = {
            mode: 'autocomplete',
            message: "Select Container(s)",
            fields: ['name', 'properties.status', 'properties.image', 'properties.num_instances', 'owner.name', 'properties.provider.name'],
            sortBy: 'name'
        }
    
        const container = await ui.selectContainer(options, containers);
        const num_instances = await getUserInput();
        // Validate input
        validate(num_instances);

        // Confirmation step
        if (await confirmIfNeeded(num_instances)) {
            // Scale up
            container.properties.num_instances = num_instances;
            const response = await gestalt.updateContainer(container, context);
            console.log(`Container '${container.name}' scale to ${num_instances} initiated.`);
        } else {
            console.log("Aborted");
        }
    }
});

function validate(num_instances) {
    if (!num_instances) {
        throw Error(`Invalid input: num_instances is '${num_instances}', aborting.`);
    }
    if (!Number.isInteger(Number(num_instances))) {
        throw Error(`Invalid input: '${num_instances}' is not an integer, aborting.`);
    }
    if (num_instances < 0) {
        throw Error(`Invalid input: num_instances is '${num_instances}', aborting.`);
    }
}

function getUserInput() {
    const questions = [
        {
            message: "Number of instances",
            type: 'input',
            name: 'num_instances',
        },
    ];

    return inquirer.prompt(questions).then(answers => answers.num_instances);
}

function confirmIfNeeded(num_instances) {
    if (num_instances > 10) {
        const questions = [
            {
                message: `Scaling to ${num_instances}, are you sure?`,
                type: 'confirm',
                name: 'confirm',
                default: false
            },
        ];

        return inquirer.prompt(questions).then(answers => answers.confirm);
    } else {
        // No need for confirmation
        return new Promise(resolve => resolve(true));
    }
}
