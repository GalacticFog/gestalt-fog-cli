'use strict';
const gestalt = require('./gestalt');
const selectOrg = require('./selectOrg');
const selectWorkspace = require('./selectWorkspace');
const selectEnvironment = require('./selectEnvironment');
const displayContext = require('./displayContext').run;

exports.resolveOrg = (show = true) => {
    return doResolveOrg()
        .then(org => {
            return { org: org }
        })
        .then(context => doDisplayContext(context, show))
}

exports.resolveWorkspace = (show = true) => {
    return doResolveOrg().then(org => {
        return { org: org }
    })
        .then(context => doResolveWorkspace(context))
        .then(context => doDisplayContext(context, show))
}

exports.resolveEnvironment = (show = true) => {
    return doResolveOrg().then(org => {
        return { org: org }
    })
        .then(context => doResolveWorkspace(context))
        .then(context => doResolveEnvironment(context))
        .then(context => doDisplayContext(context, show))
}

function doDisplayContext(context, show) {
    if (show) {
        displayContext(context);
        console.log();
    }
    return context;
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

function doResolveWorkspace(context) {
    return new Promise((resolve, reject) => {
        const ws = gestalt.getCurrentWorkspace();
        if (!ws) {
            console.log("No Workspace in current context, resolving");
            chooseWorkspace(context).then(ws => {
                // console.log(org)
                let w = {
                    id: ws.id,
                    name: ws.name,
                    description: ws.description
                }
                resolve(Object.assign(context, { workspace: w }));
            });
        } else {
            resolve(Object.assign(context, { workspace: ws }));
        }
    });
}

function doResolveEnvironment(context) {
    return new Promise((resolve, reject) => {
        const env = gestalt.getCurrentEnvironment();
        if (!env) {
            console.log("No Environment in current context, resolving");
            chooseEnvironment(context).then(env => {
                // console.log(org)
                let e = {
                    id: env.id,
                    name: env.name,
                    description: env.description
                }
                resolve(Object.assign(context, { environment: e }));
            });
        } else {
            resolve(Object.assign(context, { environment: env }));
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

function chooseWorkspace(context) {
    return selectWorkspace.run({}, null, context).then(result => {
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


function chooseEnvironment(context) {
    return selectEnvironment.run({}, null, context).then(result => {
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


    const workspace = await selectWorkspace.run({}, null, context);
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

    // const context = {};
    // context.org = {
    //     id: org.id,
    //     name: org.name,
    //     fqon: org.fqon,
    //     description: org.description
    // }
    // context.workspace = {
    //     id: workspace.id,
    //     name: workspace.name,
    //     description: workspace.description
    // }
    // context.environment = {
    //     id: environment.id,
    //     name: environment.name,
    //     description: environment.description
    // }
}
