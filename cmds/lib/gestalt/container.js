const {
    fetchResourcesFromOrgEnvironments,
    fetchEnvironmentResources,
    createEnvironmentResource,
    fetchResource,
    updateResource,
    deleteResource,
} = require('./generic');


exports.fetchContainers = (context) => {
    if (context.org) {
        if (context.workspace) {
            if (context.environment) {
                return fetchEnvironmentResources('containers', context);
            }
            return fetchWorkspaceResources('containers', context);
        }
        // Have to iteratively fetch containers from all environments in org
        return fetchResourcesFromOrgEnvironments('containers', fqonList);
    }
    throw Error(`Context doesn't contain org info`);
}

exports.fetchOrgContainers = (fqonList) => {
    return fetchResourcesFromOrgEnvironments('containers', fqonList);
}

exports.fetchContainer = (spec, context) => {
    return fetchResource('containers', spec, context);
}

exports.createContainer = (spec, context) => {
    return createEnvironmentResource('containers', spec, context);
}

exports.updateContainer = (spec, context) => {
    return updateResource('containers', spec, context);
}

exports.deleteContainer = (spec /*, providedContext*/) => {
    return deleteResource('containers', spec);
}
