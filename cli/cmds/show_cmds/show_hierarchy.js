const { gestalt } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'hierarchy'
exports.desc = 'Show the hierarchy'
exports.builder = {
    raw: {
        description: 'Display context paths'
    }
}
exports.handler = cmd.handler(async function (argv) {
    const orgs = await gestalt.fetchOrgs();
    const results = {};
    for (org of orgs) {
        const workspaces = await gestalt.fetchOrgWorkspaces([org.properties.fqon]);

        const orgctx = {
            org: {
                fqon: org.properties.fqon,
                name: org.name,
                description: org.description
            }
        }

        // Record org path
        results[`/${org.properties.fqon}`] = orgctx;

        for (ws of workspaces) {
            const wsctx = {
                ...orgctx,
                workspace: {
                    id: ws.id,
                    name: ws.name,
                    description: ws.description
                }
            }

            // Record workspace path
            results[`/${org.properties.fqon}/${ws.name}`] = wsctx;

            const envs = await gestalt.fetchWorkspaceEnvironments(wsctx);
            for (env of envs) {
                const envctx = {
                    ...wsctx,
                    environment: {
                        name: env.name,
                        description: env.description
                    }
                };

                // Record environment path and context
                results[`/${org.properties.fqon}/${ws.name}/${env.name}`] = envctx;
            }
        }
    }

    // Display
    const sortedKeys = Object.keys(results).sort();
    for (key of sortedKeys) {
        if (argv.raw) {
            console.log(key)
        } else {
            console.log(ui.getContextString(results[key]));
        }
    }
});
