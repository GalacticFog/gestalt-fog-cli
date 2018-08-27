const {
    fetchResourcesFromOrgEnvironments,
    fetchEnvironmentResources,
    createEnvironmentResource,
    fetchResource,
    updateResource,
    deleteResource,
} = require('./generic');


exports.fetchOrgContainers = (fqonList) => {
    return fetchResourcesFromOrgEnvironments('containers', fqonList);
}

exports.fetchEnvironmentContainers = (context) => {
    return fetchEnvironmentResources('containers', context);
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
