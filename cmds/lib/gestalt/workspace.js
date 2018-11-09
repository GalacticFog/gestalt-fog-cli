const {
    fetchOrgResources,
    fetchResource,
    createOrgResource,
    updateResource,
    deleteResource
} = require('./generic');

const meta = require('./metaclient');

exports.fetchOrgWorkspaces = (fqonList) => {
    return fetchOrgResources("workspaces", fqonList);
}

exports.fetchWorkspace = (context) => {
    if (!context) throw Error("missing context");
    if (!context.workspace) throw Error("missing context.workspace");
    if (!context.workspace.id) throw Error("missing context.workspace.id");

    const spec = {
        id: context.workspace.id
    }
    return fetchResource('workspaces', spec, context);
}

exports.createWorkspace = (spec, context) => {
    return createOrgResource('workspaces', spec, context);
}

exports.updateWorkspace = (spec, context) => {
    return updateResource('workspaces', spec, context);
}

exports.deleteWorkspace = (context, options) => {
    if (!context.org) throw Error(`Missing context.org`);
    if (!context.org.fqon) throw Error(`Missing context.org.fqon`);
    if (!context.workspace) throw Error(`Missing context.workspace`);
    if (!context.workspace.id) throw Error(`Missing context.workspace.id`);

    let suffix = '';

    if (options) {
        for (let o of Object.keys(options)) {
            if (o == 'force') {
                if (options.force) {
                    suffix = '?force=true'
                }
            } else {
                throw Error(`Invalid delete resource option: ${o}`);
            }
        }
    }

    return meta.DELETE(`/${context.org.fqon}/workspaces/${context.workspace.id}${suffix}`);
}

