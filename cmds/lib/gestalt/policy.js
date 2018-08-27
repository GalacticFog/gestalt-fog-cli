const {
    fetchOrgResources,
    fetchEnvironmentResources,
    fetchWorkspaceResources,
} = require('./generic');

exports.fetchPolicies = (context) => {
    if (context.org) {
        if (context.workspace) {
            if (context.environment) {
                return fetchEnvironmentResources('policies', context);
            }
            return fetchWorkspaceResources('policies', context);
        }
        return fetchOrgResources('policies', [context.org.fqon]);
    }
    throw Error(`Context doesn't contain org info`);
}

exports.fetchPolicy = async (context, spec) => {
    if (!spec) throw Error('No spec')
    if (!spec.name && !spec.id) throw Error('No spec.name or spec.id fields')

    const policies = await this.fetchPolicies(context);
    const matchParam = spec.id ? 'id' : 'name';
    return policies.find(p => p[matchParam] == spec[matchParam]);
}

exports.updatePolicy = (spec, context) => {
    return updateResource('policies', spec, context);
}

exports.deletePolicy = (spec) => {
    return deleteResource('policies', spec);
}


// TODO: create, update, delete policy rules
