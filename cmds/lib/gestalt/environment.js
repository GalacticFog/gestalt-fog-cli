const {
    fetchOrgResources,
    fetchEnvironmentResources,
    fetchWorkspaceResources,
    createWorkspaceResource,
    fetchResource,
} = require('./generic');

exports.fetchEnvironment = (context) => {
    if (!context) throw Error("missing context");
    if (!context.environment) throw Error("missing context.environment");
    if (!context.environment.id) throw Error("missing context.environment.id");

    const spec = {
        id: context.environment.id
    }

    return fetchResource('environments', spec, context);
}

exports.fetchWorkspaceEnvironments = (context) => {
    return fetchWorkspaceResources('environments', context);
}

exports.fetchOrgEnvironments = (fqonList) => {
    return fetchOrgResources("environments", fqonList);
}

exports.createEnvironment = (spec, context) => {
    return createWorkspaceResource('environments', spec, context);
}

exports.getEnvironmentVariables = (context) => {
    console.error('TODO: getEnvironmentVariables is deprecated, use fetchEnvironmentVariables')
    return fetchEnvironmentResources('env', context);
}

exports.fetchEnvironmentVariables = (context) => {
    return fetchEnvironmentResources('env', context);
}
