const {
    fetchResourcesFromOrgEnvironments,
    fetchEnvironmentResources,
    createEnvironmentResource,
    fetchResource,
    updateResource,
    deleteResource,
} = require('./generic');

const meta = require('./metaclient')

exports.fetchJobs = (context) => {
    if (context.org) {
        if (context.workspace) {
            if (context.environment) {
                return fetchEnvironmentResources('jobs', context);
            }
            return fetchWorkspaceResources('jobs', context);
        }
        // Have to iteratively fetch containers from all environments in org
        return fetchResourcesFromOrgEnvironments('jobs', fqonList);
    }
    throw Error(`fetchJobs: Context doesn't contain org info`);
}

exports.fetchOrgJobs = (fqonList) => {
    return fetchResourcesFromOrgEnvironments('jobs', fqonList);
}

exports.fetchJob = (spec, context) => {
    return fetchResource('jobs', spec, context);
}

exports.createJob = (spec, context) => {
    return createEnvironmentResource('jobs', spec, context);
}

exports.deleteJob = (spec, options) => {
    return deleteResource('jobs', spec, options);
}