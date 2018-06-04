const gestalt = require('../lib/gestalt')
const io = require('../lib/gestalt-io');

exports.doExport = doExport;

async function doExport(selectedWorkspaces, selectedEnvironments, types, outputPath, exportOptions) {
    console.log(exportOptions)
    // Export selected workspaces
    console.log();
    console.log('Exporting Workspaces...');
    for (let ws of selectedWorkspaces) {
        const path = `${outputPath}/${gestalt.getHost()}/${ws.org.properties.fqon}`;
        io.exportWorkspace(path, ws);
    }

    // Export selected environments
    console.log();
    console.log('Exporting Environments...');
    for (let env of selectedEnvironments) {

        const envContext = { org: { fqon: env.org.properties.fqon }, environment: { id: env.id } };

        const resources = {};
        for (let type of types) {
            const res = await gestalt.fetchEnvironmentResources(type, envContext);
            resources[type] = res;
        }

        const path = outputPath + '/' + gestalt.getHost() + `/${env.org.properties.fqon}/${env.properties.workspace.name}`;
        io.exportEnvironment(path, env, resources, exportOptions);
    }

    console.log();
    console.log('Done.');
}


// exports.processOrg = processOrg;
// exports.processWorkspace = processWorkspace;
// exports.processEnvironment = processEnvironment;


// async function processOrg(fqon, types) {
//     const context = { org: { fqon: fqon } };

//     // Fetch the workspace and environments
//     const workspaces = await gestalt.fetchOrgWorkspaces([context.org.fqon]);

//     const path = gestalt.getHost() + `/${context.org.fqon}`;

//     for (let ws of workspaces) {
//         await processWorkspace(path, context, ws, types);
//     }
// }

// async function processWorkspace(path, context, ws, types) {
//     const wsContext = Object.assign(context, { workspace: { id: ws.id } });

//     const environments = await gestalt.fetchWorkspaceEnvironments(wsContext);

//     // Export workspace
//     io.exportWorkspace(path, ws);

//     // Export environments
//     for (let env of environments) {
//         processEnvironment(path + '/' + ws.name, wsContext, env, types);
//     }
// }

// async function processEnvironment(wsPath, wsContext, env, types) {
//     const envContext = Object.assign(wsContext, { environment: { id: env.id } });

//     const resources = {};
//     for (let type of types) {
//         const res = await gestalt.fetchEnvironmentResources(type, envContext);
//         resources[type] = res;
//     }

//     io.exportEnvironment(wsPath, env, resources);
// }
