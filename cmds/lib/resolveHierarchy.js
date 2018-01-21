'use strict';
const gestalt = require('./gestalt');
const selectOrg = require('./selectOrg');
const selectWorkspace = require('./selectWorkspace');
const selectEnvironment = require('./selectEnvironment');
const chalk = require('chalk');

exports.resolveOrg = () => {
    return doResolveOrg()
        .then(org => {
            return { org: org }
        })
}

exports.resolveWorkspace = () => {
    return this.resolveOrg()
        .then(state => doResolveWorkspace(state))
}

exports.resolveEnvironment = () => {
    return this.resolveWorkspace()
        .then(state => doResolveEnvironment(state))
}

// exports.chooseOrg = () => {
//     return chooseOrg();
// }

// exports.chooseWorkspace = () => {
//     return doResolveOrg()
//         .then(function (resolve, reject) {
//             return chooseWorkspace();
//         });
// }

// exports.chooseEnvironment = () => {
//     return doResolveOrg()
//         .then(doResolveWorkspace)
//         .then(function (resolve, reject) {
//             return chooseEnvironment()
//         });
// }

// exports.chooseContext = (options) => {
//     return chooseOrgWorkspaceEnvironment(options);
// }


// Resolve functions

function doResolveOrg() {
    return new Promise((resolve, reject) => {
        const org = gestalt.getCurrentOrg();
        if (!org) {
            console.log("No Org in current context, resolving");
            chooseOrg().then(org => {
                // console.log(org)
                let o = {
                    id: org.id,
                    name: org.name,
                    fqon: org.fqon,
                    description: org.description
                }
                resolve(o);
            })
        } else {
            resolve(org);
        }
    });
}

function doResolveWorkspace(state) {
    return new Promise((resolve, reject) => {
        const ws = gestalt.getCurrentWorkspace();
        if (!ws) {
            console.log("No Workspace in current context, resolving");
            chooseWorkspace(state).then(ws => {
                // console.log(org)
                let w = {
                    id: ws.id,
                    name: ws.name,
                    description: ws.description
                }
                resolve(Object.assign(state, { workspace: w }));
            });
        } else {
            resolve(Object.assign(state, { workspace: ws }));
        }
    });
}

function doResolveEnvironment(state) {
    return new Promise((resolve, reject) => {
        const env = gestalt.getCurrentEnvironment();
        if (!env) {
            console.log("No Environment in current context, resolving");
            chooseEnvironment(state).then(env => {
                // console.log(org)
                let e = {
                    id: env.id,
                    name: env.name,
                    description: env.description
                }
                resolve(Object.assign(state, { environment: e }));
            });
        } else {
            resolve(Object.assign(state, { environment: env }));
        }
    });
}

// Choose functions

function chooseOrg() {
    return selectOrg.run()
        .then(result => {
            if (result) {
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

function chooseWorkspace(state) {
    return selectWorkspace.run({}, state).then(result => {
        if (result) {
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


function chooseEnvironment(state) {
    return selectEnvironment.run({}, state).then(result => {
        if (result) {
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


    const workspace = await selectWorkspace.run({}, state);
    if (!workspace) {
        console.log("No selection, exiting.");
        return;
    }

    console.log();

    if (!options) options = {};
    if (!options.environment) options.environment = {};

    const environment = await selectEnvironment.run(options.environment);
    if (!environment) {
        console.log("No selection, exiting.");
        return;
    }

    console.log();

    return {
        org: org,
        workspace: workspace,
        environment: environment
    };

    // const state = {};
    // state.org = {
    //     id: org.id,
    //     name: org.name,
    //     fqon: org.fqon,
    //     description: org.description
    // }
    // state.workspace = {
    //     id: workspace.id,
    //     name: workspace.name,
    //     description: workspace.description
    // }
    // state.environment = {
    //     id: environment.id,
    //     name: environment.name,
    //     description: environment.description
    // }
}
