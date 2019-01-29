/**
 * Maps Meta resource types to API URL paths
 */
const resourceTypeToUrlType = {
    'Gestalt::Resource::Node::Lambda': 'lambdas',
    'Gestalt::Resource::Container': 'containers',
    'Gestalt::Resource::Api': 'apis',
    'Gestalt::Resource::Environment': 'environments',
    'Gestalt::Resource::Workspace': 'workspaces',
    'Gestalt::Resource::Organization': 'orgs',
    'Gestalt::Resource::User': 'users',
    'Gestalt::Resource::Group': 'groups',
    'Gestalt::Resource::Volume': 'volumes',
    'Gestalt::Resource::Policy': 'policies',
    'Gestalt::Resource::ApiEndpoint': 'apiendpoints',
    'Gestalt::Resource::Rule::Event': 'rules',
    'Gestalt::Resource::Rule::Limit': 'rules',
    'Gestalt::Resource::Configuration::DataFeed': 'datafeeds',
    'Gestalt::Resource::Spec::StreamSpec': 'streamspecs',
};

/**
 * These types don't allow the resource_type field to be present when creating
 * the resources.
 */
const typesNotAllowingResourceTypeFieldOnCreation = [
    'Gestalt::Resource::Node::Lambda',
    'Gestalt::Resource::Policy',
    'Gestalt::Resource::User',
    'Gestalt::Resource::Group',
    'Gestalt::Resource::Api',
    'Gestalt::Resource::ApiEndpoint',
    'Gestalt::Resource::Organization',
    'Gestalt::Resource::Workspace',
    'Gestalt::Resource::Environment',
    'Gestalt::Resource::Configuration::DataFeed',
    'Gestalt::Resource::Spec::StreamSpec',
];

/**
 * These resource types require PATCH update rather than PUT
 */
const resourceTypesRequiringPatchUpdate = [
    'Gestalt::Resource::Organization',
    'Gestalt::Resource::Workspace',
    'Gestalt::Resource::Environment',
    'Gestalt::Resource::Node::Lambda',
    'Gestalt::Resource::Api',
    'Gestalt::Resource::ApiEndpoint',
    'Gestalt::Resource::Group',
    'Gestalt::Resource::User',
    'Gestalt::Resource::Policy',
    'Gestalt::Resource::Rule::Event',
    'Gestalt::Resource::Rule::Limit',
    'Gestalt::Resource::Configuration::DataFeed',
    'Gestalt::Resource::Spec::StreamSpec',
];

const hierarchyResources = [
    'Gestalt::Resource::Organization',
    'Gestalt::Resource::Workspace',
    'Gestalt::Resource::Environment',
]

module.exports = {
    resourceTypeToUrlType,
    typesNotAllowingResourceTypeFieldOnCreation,
    resourceTypesRequiringPatchUpdate,
    hierarchyResources,
};
