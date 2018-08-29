const {
    fetchOrgResources,
    fetchResourcesFromOrgEnvironments,
    fetchEnvironmentResources,
    createEnvironmentResource,
    fetchResource,
    deleteResource
} = require('./generic');


exports.fetchOrgLambdas = (fqonList) => {
    // return fetchResourcesFromOrgEnvironments('lambdas', fqonList);

    // Lambdas can be retrieved directly from the org level - don't need to traverse environments.
    return fetchOrgResources("lambdas", fqonList);
}


exports.fetchEnvironmentLambdas = (context) => {
    return fetchEnvironmentResources('lambdas', context);
}

exports.createLambda = (spec, context) => {
    return createEnvironmentResource('lambdas', spec, context);
}

exports.fetchLambda = (spec, context) => {
    return fetchResource('lambdas', spec, context)
}

exports.deleteLambda = (spec, options) => {
    return deleteResource('lambdas', spec, options);
}