'use strict';
const gestalt = require('./gestalt');
const selectOrg = require('./selectOrg');
const selectWorkspace = require('./selectWorkspace');
const selectEnvironment = require('./selectEnvironment');
const chalk = require('chalk');

exports.resolveOrg = () => {
    return doResolveOrg().then(displayContext);
}

exports.resolveWorkspace = () => {
    return doResolveOrg()
        .then(doResolveWorkspace)
        .then(displayContext)
}

exports.resolveEnvironment = () => {
    console.log('resolving env..')
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
        const state = gestalt.getState();
        let s = `${chalk.bold('Context:')} ${chalk.green(gestalt.getHost())}`
        // let s = `${chalk.green(gestalt.getHost())}`
        if (state.org) {
            s += ` / ${chalk.green(state.org.fqon)}`;
            if (state.workspace) {
                let value = state.workspace.description || state.workspace.name
                s += ` / ${chalk.green(value)}`;
            }
            if (state.environment) {
                let value = state.environment.description || state.environment.name
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
    return selectWorkspace.run().then(result => {
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
    return selectEnvironment.run({}).then(result => {
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
    const org = await selectOrg.run();
    if (!org) {
        console.log("No selection, exiting.");
        return;
    }

    console.log();
    // console.log(`${org.fqon} selected.`);
    // console.log();

    gestalt.setCurrentOrg(org);

    const workspace = await selectWorkspace.run();
    if (!workspace) {
        console.log("No selection, exiting.");
        return;
    }

    console.log();
    // console.log(`${workspace.name} selected.`);
    // console.log();

    gestalt.setCurrentWorkspace(workspace);

    if (!options) options = {};
    if (!options.environment) options.environment = {};

    const environment = await selectEnvironment.run(options.environment);
    if (!environment) {
        console.log("No selection, exiting.");
        return;
    }

    console.log();
    // console.log(`${environment.name} selected.`);
    // console.log();

    gestalt.setCurrentEnvironment(environment);

    return {
        org: org,
        workspace: workspace,
        environment: environment
    };
}
