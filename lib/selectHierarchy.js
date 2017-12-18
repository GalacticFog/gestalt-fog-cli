'use strict';
const gestalt = require('./gestalt');
const selectOrg = require('./selectOrg');
const selectWorkspace = require('./selectWorkspace');
const selectEnvironment = require('./selectEnvironment');
const selectContext = require('./selectOrgWorkspaceEnvironment');

exports.resolveOrg = (callback) => {
    doResolveOrg()
        .then(callback);
}

exports.resolveWorkspace = (callback) => {
    doResolveOrg()
        .then(doResolveWorkspace)
        .then(callback);
}

exports.resolveEnvironment = (callback) => {
    doResolveOrg()
        .then(doResolveWorkspace)
        .then(doResolveEnvironment)
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

// TODO: How to do this?
// exports.chooseContext = (callback) => {
//     new Promise((resolve, reject) => { resolve(); })
//         .then(function (resolve, reject) {
//             chooseOrg();
//         })
//         .then(function (resolve, reject) {
//             chooseWorkspace();
//         })
//         .then(function (resolve, reject) {
//             chooseEnvironment();
//         })
//         .then(function (resolve, reject) {
//             callback();
//             resolve();
//         });
// }

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
            console.log(`${result.fqon} selected.`);
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
            console.log(`${result.name} selected.`);
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
            console.log(`${result.name} selected.`);
            console.log();
            if (resolve) { resolve(result); }
        } else {
            console.log("No selection.");
        }
    });
}
