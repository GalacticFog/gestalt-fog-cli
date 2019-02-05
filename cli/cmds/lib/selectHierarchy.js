'use strict';
const { gestalt, gestaltContext } = require('gestalt-fog-sdk');
const selectOrg = require('./selectOrg');
const selectWorkspace = require('./selectWorkspace');
const selectEnvironment = require('./selectEnvironment');
const chalk = require('./chalk');

exports.resolveOrg = () => {
    return doResolveOrg().then(displayContext);
}

exports.resolveWorkspace = () => {
    return doResolveOrg()
        .then(doResolveWorkspace)
        .then(displayContext)
}

exports.resolveEnvironment = () => {
    return doResolveOrg()
        .then(doResolveWorkspace)
        .then(doResolveEnvironment)
        .then(displayContext);
}

exports.chooseOrg = () => {
    return chooseOrg();
}

exports.chooseWorkspace = () => {
    return doResolveOrg()
        .then(function (resolve, reject) {
            return chooseWorkspace();
        });
}

exports.chooseEnvironment = () => {
    return doResolveOrg()
        .then(doResolveWorkspace)
        .then(function (resolve, reject) {
            return chooseEnvironment()
        });
}

exports.chooseContext = (options) => {
    return chooseOrgWorkspaceEnvironment(options);
}

exports.displayContext = displayContext;

function displayContext() {
    return new Promise((resolve, reject) => {
        const context = gestaltContext.getContext();
        let s = `${chalk.bold('Context:')} ${chalk.green(gestalt.getHost())}`
        // let s = `${chalk.green(gestalt.getHost())}`
        if (context.org) {
            s += ` / ${chalk.green(context.org.fqon)}`;
            if (context.workspace) {
                let value = context.workspace.description || context.workspace.name
                s += ` / ${chalk.green(value)}`;
            }
            if (context.environment) {
                let value = context.environment.description || context.environment.name
                s += ` / ${chalk.green(value)}`;
            }
        }
        // s += ` ${chalk.bold(']')}`;
        console.log(s);
        // console.log();
        resolve();
    });
}

// Resolve functions

function doResolveOrg() {
    return new Promise((resolve, reject) => {
        if (!gestalt.getCurrentOrg()) {
            console.log("No Org in current context, resolving");
            resolve(chooseOrg());
        } else {
            resolve();
        }
    });
}

function doResolveWorkspace() {
    return new Promise((resolve, reject) => {
        if (!gestalt.getCurrentWorkspace()) {
            console.log("No Workspace in current context, resolving");
            resolve(chooseWorkspace());
        } else {
            resolve();
        }
    });
}

function doResolveEnvironment() {
    return new Promise((resolve, reject) => {
        if (!gestalt.getCurrentEnvironment()) {
            console.log("No Environment in current context, resolving");
            resolve(chooseEnvironment());
        } else {
            resolve();
        }
    });
}

// Choose functions

function chooseOrg() {
    return selectOrg.run()
        .then(result => {
            if (result) {
                gestalt.setCurrentOrg(result);
                console.log();
                console.log(`Org '${result.fqon}' selected.`);
                console.log();
                return result;
            } else {
                console.log("No selection.");
                return null;
            }
        });
}

function chooseWorkspace(resolve) {
    const context = gestaltContext.getContext();
    return selectWorkspace.run({}, null, context).then(result => {
        if (result) {
            gestalt.setCurrentWorkspace(result);
            console.log();
            console.log(`Workspace '${result.name}' selected.`);
            console.log();
            return result;
        } else {
            console.log("No selection.");
            return null;
        }
    });
}


function chooseEnvironment(resolve) {
    const context = gestaltContext.getContext();
    return selectEnvironment.run({}, null, context).then(result => {
        if (result) {
            gestalt.setCurrentEnvironment(result);

            console.log();
            console.log(`Environment '${result.name}' selected.`);
            console.log();
            return result;
        } else {
            console.log("No selection.");
            return null;
        }
    });
}


async function chooseOrgWorkspaceEnvironment(options) {
    if (!options) options = {};
    if (!options.org) options.org = {};
    if (!options.workspace) options.workspace = {};
    if (!options.environment) options.environment = {};

    // Special case for 'includeNoSelection' param
    if (options.includeNoSelection) {
        options.org.includeNoSelection = true;
        options.workspace.includeNoSelection = true;
        options.environment.includeNoSelection = true;
    }

    const org = await selectOrg.run(options.org);
    if (!org) {
        // console.log("No selection, exiting.");
        return {};
    }

    console.log();
    // console.log(`${org.fqon} selected.`);
    // console.log();

    gestalt.setCurrentOrg(org);

    const workspace = await selectWorkspace.run(options.workspace, null, gestaltContext.getContext());
    if (!workspace) {
        // console.log("No selection, exiting.");
        return {
            org: org
        };
    }

    console.log();
    // console.log(`${workspace.name} selected.`);
    // console.log();

    gestalt.setCurrentWorkspace(workspace);

    const environment = await selectEnvironment.run(options.environment, null, gestaltContext.getContext());
    if (!environment) {
        // console.log("No selection, exiting.");
        return {
            org: org,
            workspace: workspace
        };
    }

    console.log();
    // console.log(`${environment.name} selected.`);
    // console.log();

    gestalt.setCurrentEnvironment(environment);

    return {
        org: { id: org.id, name: org.name, description: org.description, fqon: org.properties.fqon },
        workspace: { id: workspace.id, name: workspace.name, description: workspace.description },
        environment: { id: environment.id, name: environment.name, description: environment.description }
    };
}
