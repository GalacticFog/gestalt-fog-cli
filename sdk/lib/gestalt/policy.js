const {
    fetchResources,
    fetchEnvironmentResources,
    deleteResource,
    updateResource,
    createEnvironmentResource
} = require('./generic');

exports.fetchPolicies = (context) => {
    return fetchResources('policies', context);
}

exports.fetchEnvironmentPolicies = (providedContext) => {
    return fetchEnvironmentResources('policies', providedContext);
}

exports.fetchPolicy = async (spec, context) => {
    if (!spec) throw Error('No spec')
    if (!spec.name && !spec.id) throw Error('No spec.name or spec.id fields')

    const policies = await this.fetchPolicies(context);
    const matchParam = spec.id ? 'id' : 'name';
    return policies.find(p => p[matchParam] == spec[matchParam]);
}

exports.updatePolicy = (spec, context) => {
    return updateResource('policies', spec, context);
}

exports.deletePolicy = (spec, options) => {
    return deleteResource('policies', spec, options);
}


// TODO: create, update, delete policy rules

exports.createPolicy = (spec, providedContext) => {

    // TODO: if Workspace or Environment

    return createEnvironmentResource('policies', spec, providedContext);
}
