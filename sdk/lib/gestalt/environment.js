const {
    fetchOrgResources,
    fetchEnvironmentResources,
    fetchWorkspaceResources,
    createWorkspaceResource,
    fetchResource,
} = require('./generic');

const meta = require('./metaclient');

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

exports.deleteEnvironment = (context, options) => {
    if (!context.org) throw Error(`Missing context.org`);
    if (!context.org.fqon) throw Error(`Missing context.org.fqon`);
    if (!context.environment) throw Error(`Missing context.environment`);
    if (!context.environment.id) throw Error(`Missing context.environment.id`);

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

    return meta.DELETE(`/${context.org.fqon}/environments/${context.environment.id}${suffix}`);
}
