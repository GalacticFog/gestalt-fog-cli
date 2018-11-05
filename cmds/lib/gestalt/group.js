const {
    fetchOrgResources,
    createOrgResource,
    deleteResource
} = require('./generic');

const meta = require('./metaclient');

exports.fetchGroups = () => {
    return fetchOrgResources("groups", ['root']); // Must be at root Org
}

exports.createGroup = (spec) => {
    return createOrgResource('groups', spec, { org: { fqon: 'root' } }); // Must be at root Org
}

exports.deleteGroup = (spec, options) => {
    return deleteResource('groups', spec, options);
}


exports.addUserToGroup = (spec, userSpec) => {
    if (!spec) throw Error(`Missing spec`);
    if (!spec.id) throw Error(`Missing spec.id`);
    if (!userSpec) throw Error(`Missing userSpec`);
    if (!userSpec.id) throw Error(`Missing userSpec.id`);
    return meta.PATCH(`/root/groups/${spec.id}/users?id=${userSpec.id}`);
}

exports.removeUserFromGroup = (spec, userSpec) => {
    if (!spec) throw Error(`Missing spec`);
    if (!spec.id) throw Error(`Missing spec.id`);
    if (!userSpec) throw Error(`Missing userSpec`);
    if (!userSpec.id) throw Error(`Missing userSpec.id`);
    return meta.DELETE(`/root/groups/${spec.id}/users?id=${userSpec.id}`);
}
