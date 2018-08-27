const {
    fetchOrgResources,
    fetchResource,
    createOrgResource,
    updateResource,
    deleteResource
} = require('./generic');

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

exports.deleteWorkspace = (spec) => {
    return deleteResource('workspaces', spec);
}
