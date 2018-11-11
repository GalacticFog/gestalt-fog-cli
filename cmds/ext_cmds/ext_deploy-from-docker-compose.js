const dockerComposeParser = require('../lib/gestalt-docker-compose-parser');
const selectProvider = require('../lib/selectProvider');
const displayResource = require('../lib/displayResourceUI');
const selectEnvironment = require('../lib/selectEnvironment');
const gestalt = require('../lib/gestalt');
const gestaltContext = require('../lib/gestalt-context');
const selectHierarchy = require('../lib/selectHierarchy');
const chalk = require('../lib/chalk');
const cmd = require('../lib/cmd-base');
exports.command = 'deploy-from-docker-compose [file]'
exports.desc = 'Deploy from Docker Compose file'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    const file = argv.file;

    const containers = dockerComposeParser.convertFromV3File(file);

    displayContainers(containers);

    // Now, containers need to have an environment and provider assigned

    await selectHierarchy.resolveWorkspace();
    const env = await selectEnvironment.run({}, null, context);
    console.log();

    gestalt.setCurrentEnvironment(env);

    const provider = await selectProvider.run({});
    console.log();

    // Assign the provider to each container
    for (let c of containers) {
        c.properties.provider = {
            id: provider.id,
        };
    }

    const context = gestaltContext.getContext();

    console.log("Containers will be created in the following location:");
    console.log();
    console.log('    Org:         ' + chalk.bold(`${context.org.description} (${context.org.fqon})`));
    console.log('    Workspace:   ' + chalk.bold(`${context.workspace.description} (${context.workspace.name})`));
    console.log('    Environment: ' + chalk.bold(`${context.environment.description} (${context.environment.name})`));
    console.log('    Provider:    ' + chalk.bold(`${provider.description} (${provider.name})`));
    console.log();

    const confirmed = await doConfirm();
    if (!confirmed) {
        console.log('Aborted.');
        return;
    }

    const createdContainers = containers.map(item => {
        console.log(`Creating container ${item.name}`);
        const container = gestalt.createContainer(item, context);
        return container;
    });

    displayRunningContainers(createdContainers);
    console.log('Done.');


    function displayContainers(containers) {

        const options = {
            message: "Containers Pending Creation",
            headers: ['Container', 'Description', 'Image', 'CPU', 'Memory (MB)', 'Ports'],
            fields: ['name', 'description', 'properties.image', 'properties.cpus', 'properties.memory', 'ports'],
            sortField: 'description',
        }

        const res = containers.map(item => {
            let r = Object.assign({}, item);
            r.ports = JSON.stringify(r.properties.port_mappings);
            return r;
        });

        displayResource.run(options, res);
    }

    function displayRunningContainers(containers) {

        const options = {
            message: "Containers",
            headers: ['Container', 'Description', 'Status', 'Image', 'Instances', 'Owner'],
            fields: ['name', 'description', 'properties.status', 'properties.image', 'running_instances', 'owner.name'],
            sortField: 'description',
        }

        containers.map(item => {
            item.running_instances = `${item.properties.tasks_running} / ${item.properties.num_instances}`
        })

        displayResource.run(options, containers);
    }

    function doConfirm() {
        const inquirer = require('inquirer');
        const questions = [
            {
                message: "Proceed?",
                type: 'confirm',
                name: 'confirm',
                default: false // Don't proceed if no user input
            },
        ];

        return inquirer.prompt(questions).then(answers => {
            return answers.confirm;
        });
    }
});