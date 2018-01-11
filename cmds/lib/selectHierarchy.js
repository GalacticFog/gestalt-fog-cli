'use strict';
const gestalt = require('./gestalt');
const selectOrg = require('./selectOrg');
const selectWorkspace = require('./selectWorkspace');
const selectEnvironment = require('./selectEnvironment');
const selectContext = require('./selectOrgWorkspaceEnvironment');
const chalk = require('chalk');

exports.resolveOrg = (callback) => {
    doResolveOrg()
        .then(displayContext)
        .then(callback);
}

exports.resolveWorkspace = (callback) => {
    doResolveOrg()
        .then(doResolveWorkspace)
        .then(displayContext)
        .then(callback);
}

exports.resolveEnvironment = (callback) => {
    doResolveOrg()
        .then(doResolveWorkspace)
        .then(doResolveEnvironment)
        .then(displayContext)
        .then(callback);
}

exports.chooseOrg = (callback) => {
    chooseOrg(callback);
}

exports.chooseWorkspace = (callback) => {
    doResolveOrg()
        .then(function (resolve, reject) {
            chooseWorkspace(callback);
        });
}

exports.chooseEnvironment = (callback) => {
    doResolveOrg()
        .then(doResolveWorkspace)
        .then(function (resolve, reject) {
            chooseEnvironment(callback)
        });
}

exports.chooseContext = (callback) => {
    selectContext.run({}, callback);
}

exports.displayContext = displayContext;

function displayContext() {
    const state = gestalt.getState();
    let s = `${chalk.bold('Current Context')}: ${chalk.green(gestalt.getHost())}`
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
    console.log(s);
    console.log();
}

function doResolveOrg() {
    return new Promise((resolve, reject) => {
        if (!gestalt.getCurrentOrg()) {
            console.log("No Org in current context, resolving");
            chooseOrg(resolve);
        } else {
            resolve();
        }
    });
}

function chooseOrg(resolve) {
    selectOrg.run((result) => {
        if (result) {
            gestalt.setCurrentOrg(result);
            console.log();
            console.log(`Org '${result.fqon}' selected.`);
            console.log();
            if (resolve) { resolve(result); }
        } else {
            console.log("No selection.");
        }
    });
}

function doResolveWorkspace() {
    return new Promise((resolve, reject) => {
        if (!gestalt.getCurrentWorkspace()) {
            console.log("No Workspace in current context, resolving");
            chooseWorkspace(resolve);
        } else {
            resolve();
        }
    });
}

function chooseWorkspace(resolve) {
    selectWorkspace.run((result) => {
        if (result) {
            gestalt.setCurrentWorkspace(result);
            console.log();
            console.log(`Workspace '${result.name}' selected.`);
            console.log();
            if (resolve) { resolve(result); }
        } else {
            console.log("No selection.");
        }
    });
}

function doResolveEnvironment() {
    return new Promise((resolve, reject) => {
        if (!gestalt.getCurrentEnvironment()) {
            console.log("No Environment in current context, resolving");
            chooseEnvironment(resolve);
        } else {
            resolve();
        }
    });
}

function chooseEnvironment(resolve) {
    selectEnvironment.run({}, (result) => {
        if (result) {
            gestalt.setCurrentEnvironment(result);

            console.log();
            console.log(`Environment '${result.name}' selected.`);
            console.log();
            if (resolve) { resolve(result); }
        } else {
            console.log("No selection.");
        }
    });
}
