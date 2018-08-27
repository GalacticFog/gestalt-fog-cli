const {
    fetchOrgResources,
    fetchEnvironmentResources,
    fetchWorkspaceResources,
    createWorkspaceResource,
    fetchResource,
} = require('./generic');

const meta = require('./metaclient')

exports.createEnvironment = (spec, context) => {
    return createWorkspaceResource('environments', spec, context);
}

exports.fetchEnvironment = (spec, context) => {
    return fetchResource('environments', spec, context);
    // context = context || getGestaltContext();
    // if (!context.org) throw Error("No Org in current context");
    // if (!context.org.fqon) throw Error("No FQON in current context");
    // return meta.GET(`/${context.org.fqon}/environments/${uid}`)
}

exports.fetchWorkspaceEnvironments = (context) => {
    return fetchWorkspaceResources('environments', context);
}

exports.fetchOrgEnvironments = (fqonList) => {
    return fetchOrgResources("environments", fqonList);
}

exports.fetchEnvironment = (context) => {
    if (!context) throw Error("missing context");
    if (!context.environment) throw Error("missing context.environment");
    if (!context.environment.id) throw Error("missing context.environment.id");

    const spec = {
        id: context.environment.id
    }

    return fetchResource('environments', spec, context);
}

exports.getEnvironmentVariables = (context) => {
    console.error('TODO: getEnvironmentVariables is deprecated, use fetchEnvironmentVariables')
    return fetchEnvironmentResources('env', context);
}

exports.fetchEnvironmentVariables = (context) => {
    return fetchEnvironmentResources('env', context);
}
