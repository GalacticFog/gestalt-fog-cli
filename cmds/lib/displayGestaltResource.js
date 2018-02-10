const gestalt = require('./gestalt');
const displayResource = require('./displayResourceUI').run;

fmap = {
    'Gestalt::Resource::Node::Lambda': displayLambdas,
    'Gestalt::Resource::Container': displayContainers,
    'Gestalt::Resource::Api': displayApis,
    'Gestalt::Resource::Environment': displayEnvironments,
    'Gestalt::Resource::Workspace': displayWorkspaces,
    'Gestalt::Resource::Organization': displayOrgs,
    'Gestalt::Resource::User': displayUsers,
    'Gestalt::Resource::Group': displayGroups,
    'Gestalt::Resource::ApiEndpoint': displayApiEndpoints,
}


exports.run = (resources, options) => {

    if (options && options.raw) {
        console.log(JSON.stringify(resources, null, 2));
    } else if (resources.length == 0) {
        console.log('No resources.');
    } else {
        let resourceType = resources[0].resource_type;
        if (!resourceType) throw Error("No resources[0].resource_type property");
        let fn = null;
        if (resourceType.indexOf('Gestalt::Configuration::Provider::') == 0) {
            fn = displayProviders;
        } else {
            fn = fmap[resourceType];
        }
        if (fn) {
            fn(resources, options);
        } else {
            throw Error(`No display function for resource type '${resourceType}'`);
        }
    }
}

function displayLambdas(resources, opts) {
    let options = {
        message: "Lambdas",
        headers: ['Name', 'Runtime', 'Public', 'FQON', 'Type', 'Owner', 'ID' /*, 'Provider'*/],
        fields: ['name', 'properties.runtime', 'properties.public', 'org.properties.fqon', 'properties.code_type', 'owner.name', 'id' /*, 'properties.provider.name'*/],
        sortField: 'description',
    }
    displayResource(Object.assign(options, opts), resources);
}

function displayContainers(containers, opts) {
    const options = {
        message: "Containers",
        headers: ['Container', 'Description', 'Status', 'Image', 'Instances', 'Owner', 'FQON', 'ENV', 'Provider'],
        fields: ['name', 'description', 'properties.status', 'properties.image', 'running_instances', 'owner.name', 'org.properties.fqon', 'environment.name', 'properties.provider.name'],
        sortField: 'org.properties.fqon',
    }

    // Transform for display
    for (let item of containers) {
        if (item.description) {
            if (item.description.length > 20) {
                item.description = item.description.substring(0, 20) + '...';
            }
        }
        // item.fqon = fqon;
        item.running_instances = `${item.properties.tasks_running} / ${item.properties.num_instances}`;
    }

    displayResource(Object.assign(options, opts), containers);
}

exports.displayContainerInstances = displayContainerInstances;

function displayContainerInstances(resources, opts) {
    const options = {
        message: "Container Instances",
        headers: ['Container Instances', 'Host', 'Addresses', 'Ports', 'Started'],
        fields: ['id', 'host', 'ipAddresses', 'ports', 'startedAt'],
        sortField: 'description',
    }

    displayResource(Object.assign(options, opts), containers);
}

function displayApis(resources, opts) {
    const options = {
        message: "APIs",
        headers: [
            'Name',
            'FQON',
            'Owner',
            'ID'
        ],
        fields: [
            'name',
            'org.properties.fqon',
            'owner.name',
            'id'
        ],
        sortField: 'description',
    }

    displayResource(Object.assign(options, opts), resources);
}

function displayEnvironments(resources, opts) {
    const options = {
        message: "Environments",
        headers: ['Description', 'Name', 'Org', 'Type', 'Workspace', 'Owner'],
        fields: ['description', 'name', 'org.properties.fqon', 'properties.environment_type', 'properties.workspace.name', 'owner.name'],
        sortField: 'description',
    }
    displayResource(Object.assign(options, opts), resources);
}

function displayWorkspaces(resources, opts) {
    if (opts.all) {
        const options = {
            message: "Workspaces",
            headers: ['Org', 'Description', 'Name', 'Owner'],
            fields: ['org.properties.fqon', 'description', 'name', 'owner.name'],
            sortField: 'org.properties.fqon',
        }
        displayResource(Object.assign(options, opts), resources);
    } else {
        const options = {
            message: "Workspaces",
            headers: ['Workspace', 'Name', 'Org', 'Owner'],
            fields: ['description', 'name', 'org.properties.fqon', 'owner.name'],
            sortField: 'description',
        }
        displayResource(Object.assign(options, opts), resources);
    }
}

function displayOrgs(resources, opts) {
    const options = {
        message: "Orgs",
        headers: ['Name', 'FQON', 'Owner'],
        fields: ['description', 'fqon', 'owner.name'],
        sortField: 'fqon',
    }
    displayResource(Object.assign(options, opts), resources);
}

function displayUsers(resources, opts) {
    const options = {
        message: "Users",
        headers: ['User', 'Description', 'Org', 'Owner', 'ID', 'Groups', 'Created'],
        fields: ['name', 'description', 'org.properties.fqon', 'owner.name', 'id', 'properties.groups', 'created.timestamp'],
        sortField: 'name',
    }
    displayResource(Object.assign(options, opts), resources);
}

function displayGroups(resources, opts) {
    const options = {
        message: "Groups",
        headers: ['UID', 'Group', 'Description', 'Org', 'Owner' /*'Created'*/],
        fields: ['id', 'name', 'description', 'org.properties.fqon', 'owner.name' /*'created.timestamp'*/],
        sortField: 'name',
    }
    displayResource(Object.assign(options, opts), resources);
}

function displayApiEndpoints(resources, opts) {
    let options = null;
    if (opts.all) {
        options = {
            message: "API Endpoints",
            headers: [
                'Resource Path',
                'Type',
                'Security',
                'FQON',
                // 'Workspace',
                // 'Environment',
                'Synchronous',
                'Methods',
                'Owner'
            ],
            fields: [
                'properties.api_path',
                'properties.implementation_type',
                'properties.plugins.gestaltSecurity.enabled',
                'org.properties.fqon',
                // 'properties.workspace',
                // 'properties.environment',
                'properties.synchronous',
                'properties.methods',
                'owner.name'
            ],
            sortField: 'description',
        }
    } else if (opts.org) {
        options = {
            message: "API Endpoints",
            headers: [
                'Resource Path',
                'Type',
                'Security',
                'FQON',
                // 'Workspace',
                // 'Environment',
                'Synchronous',
                'Methods',
                'Owner'
            ],
            fields: [
                'properties.api_path',
                'properties.implementation_type',
                'properties.plugins.gestaltSecurity.enabled',
                'org.properties.fqon',
                // 'properties.workspace',
                // 'properties.environment',
                'properties.synchronous',
                'properties.methods',
                'owner.name'
            ],
            sortField: 'description',
        }
    } else {
        options = {
            message: "API Endpoints",
            headers: [
                'Resource Patch',
                'Type',
                'Security',
                'FQON',
                'Workspace',
                'Environment',
                'Synchronous',
                'Methods',
                'Owner'
            ],
            fields: [
                'properties.api_path',
                'properties.implementation_type',
                'properties.plugins.gestaltSecurity.enabled',
                'org.properties.fqon',
                'properties.workspace',
                'properties.environment',
                'properties.synchronous',
                'properties.methods',
                'owner.name'
            ],
            sortField: 'description',
        }
    }
    displayResource(Object.assign(options, opts), resources);
}

function displayProviders(resources, opts) {
    const options = {
        message: "Providers",
        headers: ['Provider', 'Description', 'Type', 'Org', 'Owner', 'UID'/*'Created'*/],
        fields: ['name', 'description', 'resource_type', 'org.properties.fqon', 'owner.name', 'id'/*'created.timestamp'*/],
        sortField: 'name',
    }
    for (let item of resources) {
        item.resource_type = item.resource_type.replace(/Gestalt::Configuration::Provider::/, '')
        if (item.description) {
            if (item.description.length > 20) {
                item.description = item.description.substring(0, 20) + '...';
            }
        }
    }
    displayResource(Object.assign(options, opts), resources);
}
