const gestalt = require('../lib/gestalt');
const ui = require('../lib/gestalt-ui')
const chalk = require('chalk');
const inquirer = require('inquirer');
const cmd = require('../lib/cmd-base');
exports.command = 'containers'
exports.desc = 'Clone containers'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const context = await ui.resolveWorkspace();
    console.log();
    console.log(chalk.bold('Clone containers from one environment to another'));
    console.log();
    console.log("Select source environment");
    console.log();
    const sourceEnv = await ui.selectEnvironment({}, context);
    console.log();

    context.environment = {
        id: sourceEnv.id,
        name: sourceEnv.name,
        description: sourceEnv.description
    }

    const containers = await gestalt.fetchEnvironmentContainers(context);

    console.log("Select containers to clone (use arrows and spacebar to modify selection)");
    console.log();

    const selectedContainers = await ui.selectContainer({ mode: 'checkbox', defaultChecked: true }, containers);
    console.log();

    console.log("Select target environment to clone containers to")
    console.log();

    const targetEnv = await ui.selectEnvironment({}, context);
    console.log();

    // Ensure different environments were used
    if (sourceEnv.id == targetEnv.id) {
        console.log("Aborting - can't use the same source and destination enviornment");
        return;
    }

    context.environment = {
        id: targetEnv.id,
        name: targetEnv.name,
        description: targetEnv.description
    }

    console.log("Containers will be created in the following location:");
    console.log();
    console.log('    Org:         ' + chalk.bold(`${context.org.description} (${context.org.fqon})`));
    console.log('    Workspace:   ' + chalk.bold(`${context.workspace.description} (${context.workspace.name})`));
    console.log('    Environment: ' + chalk.bold(`${context.environment.description} (${context.environment.name})`));
    // console.log('    Provider:    ' + chalk.bold(`${provider.description} (${provider.name})`));
    console.log();

    ui.displayResources(selectedContainers)

    const confirmed = await ui.promptToContinue(`Proceed to clone ${selectedContainers.length} container(s)?`, false);
    if (!confirmed) {
        console.log('Aborted.');
        return;
    }

    const createContainerPromises = selectedContainers.map(item => {
        const c = cloneContainerPayload(item);
        return gestalt.createContainer(c, context);
    });

    const results = await Promise.all(createContainerPromises);
    const createdContainers = [].concat.apply([], results); // flatten array
    ui.displayResources(createdContainers);

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
