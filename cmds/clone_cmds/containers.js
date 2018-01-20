const cmd = require('../lib/cmd-base');
exports.command = 'containers'
exports.desc = 'Clone containers'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    const selectProvider = require('../lib/selectProvider');
    const selectEnvironment = require('../lib/selectEnvironment');
    const selectContainer = require('../lib/selectContainer');
    const gestalt = require('../lib/gestalt');
    const selectHierarchy = require('../lib/selectHierarchy');
    const displayResource = require('../lib/displayResourceUI');
    const chalk = require('chalk');
    const inquirer = require('inquirer');

    await selectHierarchy.resolveWorkspace();

    console.log();
    console.log(chalk.bold('Clone containers from one environment to another'));
    console.log();
    console.log("Select source environment");
    console.log();
    const sourceEnv = await selectEnvironment.run({});
    console.log();

    gestalt.setCurrentEnvironment(sourceEnv);

    const containers = await gestalt.fetchContainers();

    console.log("Select containers to clone (use arrows and spacebar to modify selection)");
    console.log();

    const selectedContainers = await selectContainer.run({ mode: 'checkbox', defaultChecked: true });
    console.log();

    console.log("Select target environment to clone containers to")
    console.log();

    const targetEnv = await selectEnvironment.run({});
    console.log();

    // Ensure different environments were used
    if (sourceEnv.id == targetEnv.id) {
        console.log("Aborting - can't use the same source and destination enviornment");
        return;
    }

    gestalt.setCurrentEnvironment(targetEnv);

    const state = gestalt.getState();

    console.log("Containers will be created in the following location:");
    console.log();
    console.log('    Org:         ' + chalk.bold(`${state.org.description} (${state.org.fqon})`));
    console.log('    Workspace:   ' + chalk.bold(`${state.workspace.description} (${state.workspace.name})`));
    console.log('    Environment: ' + chalk.bold(`${state.environment.description} (${state.environment.name})`));
    // console.log('    Provider:    ' + chalk.bold(`${provider.description} (${provider.name})`));
    console.log();

    displayRunningContainers(selectedContainers);

    const confirmed = await doConfirm();
    if (!confirmed) {
        console.log('Aborted.');
        return;
    }

    const createContainerPromises = selectedContainers.map(item => {
        const c = cloneContainerPayload(item);
        return gestalt.createContainer(c, state);
    });

    Promise.all(createContainerPromises).then(results => {
        const createdContainers = [].concat.apply([], results); // flatten array
        displayRunningContainers(createdContainers);
        console.log('Done.');
    });

    function cloneContainerPayload(src) {
        let op = src.properties;
        return {
            name: src.name,
            description: src.description,
            properties: {
                provider: {
                    id: op.provider.id
                },
                num_instances: op.num_instances,
                cpus: op.cpus,
                memory: op.memory,
                disk: op.disk,
                container_type: op.container_type,
                image: op.image,
                network: op.network,
                health_checks: op.health_checks ? op.health_checks : [],
                port_mappings: op.port_mappings ? op.port_mappings : [],
                labels: op.labels ? op.labels : {},
                env: op.env ? op.env : {},
                volumes: op.volumes ? op.volumes : [],
                force_pull: op.force_pull ? op.force_pull : false,
                constraints: op.constraints ? op.constraints : [],
                accepted_resource_roles: op.accepted_resource_roles ? op.accepted_resource_roles : [],
                args: op.args,
                cmd: op.cmd,
                user: op.user
            }
        }
    }

    function displayRunningContainers(containers) {

        const options = {
            message: "Containers",
            headers: ['Container', 'Description', 'Status', 'Image', 'Instances', 'Owner'],
            fields: ['name', 'description', 'properties.status', 'properties.image', 'running_instances', 'owner.name'],
            sortField: 'description',
        }

        for (let item of containers) {
            item.running_instances = `${item.properties.tasks_running} / ${item.properties.num_instances}`
        }

        displayResource.run(options, containers);
    }


    function doConfirm() {
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