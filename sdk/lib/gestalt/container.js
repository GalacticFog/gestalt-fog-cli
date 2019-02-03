const {
    fetchResourcesFromOrgEnvironments,
    fetchEnvironmentResources,
    createEnvironmentResource,
    fetchResource,
    updateResource,
    deleteResource,
} = require('./generic');

const meta = require('./metaclient')

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
    throw Error(`fetchContainers: Context doesn't contain org info`);
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

exports.deleteContainer = (spec, options) => {
    return deleteResource('containers', spec, options);
}

exports.migrateContainer = (spec, context) => {
    if (!spec) throw Error(`missing spec`);
    if (spec.resource_type) {
        if (spec.resource_type != 'Gestalt::Resource::Container') {
            throw Error(`Expected spec.resource_type to be 'Gestalt::Resource::Container', but was '${spec.resource_type}'`);
        }
    }
    if (!context) throw Error('missing context')
    if (!context.org) throw Error('missing context.org')
    if (!context.org.fqon) throw Error('missing context.org.fqon')
    if (!context.provider) throw Error('missing context.provider')
    if (!context.provider.id) throw Error('missing context.provider.id')
    if (!spec.id) throw Error(`createResource: spec.resource_type is '${spec.resource_type}'`);
    if (!context) throw Error(`createResource: context is '${context}'`);
    return meta.POST(`/${context.org.fqon}/containers/${spec.id}/migrate?provider=${context.provider.id}`);
}

exports.promoteContainer = (spec, context) => {
    if (!spec) throw Error(`missing spec`);
    if (spec.resource_type) {
        if (spec.resource_type != 'Gestalt::Resource::Container') {
            throw Error(`Expected spec.resource_type to be 'Gestalt::Resource::Container', but was '${spec.resource_type}'`);
        }
    }
    if (!context) throw Error('missing context')
    if (!context.org) throw Error('missing context.org')
    if (!context.org.fqon) throw Error('missing context.org.fqon')
    if (!context.target_environment) throw Error('missing context.target_environment')
    if (!context.target_environment.id) throw Error('missing context.target_environment.id')
    if (!spec.id) throw Error(`createResource: spec.resource_type is '${spec.resource_type}'`);
    if (!context) throw Error(`createResource: context is '${context}'`);
    return meta.POST(`/${context.org.fqon}/containers/${spec.id}/promote?target=${context.target_environment.id}`);
}
