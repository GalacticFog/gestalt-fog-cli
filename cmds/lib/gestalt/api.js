const {
    fetchOrgResources,
    fetchEnvironmentResources,
    fetchResource,
    createEnvironmentResource,
    deleteResource
} = require('./generic');

exports.fetchOrgApis = (fqonList) => {
    // return fetchResourcesFromOrgEnvironments("apis", fqonList);
    
    // APIs can be retrieved directly from the org level
    return fetchOrgResources("apis", fqonList);
}

exports.fetchEnvironmentApis = (providedContext) => {
    return fetchEnvironmentResources('apis', providedContext);
}

exports.fetchApi = (spec, context) => {
    return fetchResource('apis', spec, context);
}

exports.createApi = (spec, providedContext) => {
    return createEnvironmentResource('apis', spec, providedContext);
}

exports.deleteApi = (spec, options) => {
    return deleteResource('apis', spec, options);
}
