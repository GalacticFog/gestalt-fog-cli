const displayContext = require('./displayContext');
const doDisplayResource = require('./displayResourceUI').run;
const yaml = require('js-yaml');
const util = require('./util');

const fmap = {
    // Explicit types
    'Gestalt::Resource::ApiEndpoint': displayApiEndpoints, // Must come before API
    'Gestalt::Resource::Api': displayApis,
    'Gestalt::Resource::Container': displayContainers,
    'Gestalt::Resource::Environment': displayEnvironments,
    'Gestalt::Resource::Group': displayGroups,
    'Gestalt::Resource::Job': displayJobs,
    'Gestalt::Resource::Node::Lambda': displayLambdas,
    'Gestalt::Resource::Organization': displayOrgs,
    'Gestalt::Resource::Policy': displayPolicies,
    'Gestalt::Resource::User': displayUsers,
    'Gestalt::Resource::Volume': displayVolumes,
    'Gestalt::Resource::Workspace': displayWorkspaces,

    // Prefix types
    'Gestalt::Configuration::Provider::': displayProviders,
    'Gestalt::Resource::Rule::': displayPolicyRules,
}

exports.run = (resources, options = {}, context) => {

    if (options && options.name) {
        resources = resources.filter(r => r.name == options.name);
    }

    if (options && options.raw) {
        console.log(JSON.stringify(resources, null, 2));
    } else if (options && options.output) {
        if (options.output == 'raw' || options.output == 'json') {
            console.log(JSON.stringify(resources, null, 2));
        } else if (options.output == 'yaml') {
            console.log(yaml.safeDump(resources));
        } else if (options.output == 'list') {
            for (let res of resources) {
                console.log(res.name);
            }
        }
    } else if (Array.isArray(resources)) {
        if (resources.length == 0) {
            console.log(getContextMessage('', context));
            console.error('No resources.');
            // console.log();
        } else if (resources[0].resource_type) {
            const resourceType = resources[0].resource_type;
            if (!resourceType) throw Error("No resources[0].resource_type property");
            const fn = fmap[Object.keys(fmap).find(key => resourceType.indexOf(key) == 0)];
            if (fn) {
                fn(resources, options, context);
            } else {
                // throw Error(`No display function for resource type '${resourceType}'`);
                console.log(yaml.dump(resources));
            }
        } else {
            console.log(yaml.dump(resources));
        }
    } else {
        // throw Error(`No display function for resource type '${resourceType}'`);
        console.log(yaml.dump(resources));
    }
}

function displayResource(options, opts = {}, resources) {

    if (opts.more) {
        options.headers.push('ID');
        options.fields.push('id');
    }

    if (opts['fields']) {
        let add = false;
        let fields = null;
        if (opts['fields'].startsWith('+')) {
            add = true
            fields = opts['fields'].slice(1).split(',');
        } else {
            fields = opts['fields'].split(',');
        }

        if (add) {
            options.fields = options.fields.concat(fields);
            options.headers = options.headers.concat(fields);
        } else {
            options.fields = fields;
            options.headers = fields;
        }
    }

    // Clone so not to mutate
    opts = util.cloneObject(opts);
    doDisplayResource(Object.assign(opts, options), resources);
}

function getContextMessage(message, context) {
    return context ? `${displayContext.contextString(context)} / ${message}` : message;
}

function displayLambdas(resources, opts, context) {
    const options = {
        message: getContextMessage('Lambdas', context),
        headers: ['Lambda', 'Runtime', 'Public', /*'FQON',*/ 'Type', 'Owner', 'Provider ID'],
        fields: ['name', 'properties.runtime', 'properties.public', /*'org.properties.fqon',*/ 'properties.code_type', 'owner.name', 'properties.provider.id'],
        sortField: 'name',
    }

    displayResource(options, opts, resources);
}

function displayContainers(resources, opts, context) {
    const options = {
        message: getContextMessage('Containers', context),
        headers: ['Container', 'Description', 'Status', 'Image', 'CPU', 'Memory', 'Instances', 'Owner', /*'FQON', 'ENV',*/ 'Provider'],
        fields: ['name', 'description', 'properties.status', 'properties.image', 'properties.cpus', 'properties.memory', 'running_instances', 'owner.name', /*'org.properties.fqon', 'environment.name',*/ 'properties.provider.name'],
        sortField: 'name',
    }

    // Transform for display
    for (let item of resources) {
        if (item.description) {
            if (item.description.length > 20) {
                item.description = item.description.substring(0, 20) + '...';
            }
        }
        // item.fqon = fqon;
        item.running_instances = `${item.properties.tasks_running || 0} / ${item.properties.num_instances}`;
    }

    displayResource(options, opts, resources);
}

exports.displayContainerInstances = displayContainerInstances;

function displayContainerInstances(resources, opts, context) {
    const options = {
        message: getContextMessage('Container / Container Instances', context),
        headers: ['Container Instances', 'Host', 'Addresses', 'Ports', 'Started'],
        fields: ['id', 'host', 'ipAddresses', 'ports', 'startedAt'],
        sortField: 'description',
    }

    displayResource(options, opts, resources);
}

function displayApis(resources, opts, context) {
    const options = {
        message: getContextMessage('APIs', context),
        headers: [
            'API',
            //'FQON',
            'Owner',
        ],
        fields: [
            'name',
            //'org.properties.fqon',
            'owner.name',
        ],
        sortField: 'description',
    }

    displayResource(options, opts, resources);
}

function displayEnvironments(resources, opts, context) {
    const options = {
        message: getContextMessage('Environments', context),
        headers: ['Environment', 'Description', 'Type', 'Org', 'Workspace', 'Owner'],
        fields: ['name', 'description', 'properties.environment_type', 'org.properties.fqon', 'properties.workspace.name', 'owner.name'],
        sortField: 'name',
    }
    displayResource(options, opts, resources);
}

function displayWorkspaces(resources, opts, context) {
    const options = {
        message: getContextMessage('Workspaces', context),
        headers: ['Workspace', 'Description', 'Org', 'Owner'],
        fields: ['name', 'description', 'org.properties.fqon', 'owner.name'],
        sortField: 'name',
    }
    displayResource(options, opts, resources);
}

function displayOrgs(resources, opts, context) {
    const options = {
        message: getContextMessage('Orgs', context),
        headers: ['FQON', 'Name', 'Description', 'Owner'],
        fields: ['fqon', 'name', 'description', 'owner.name'],
        sortField: 'fqon',
    }
    displayResource(options, opts, resources);
}

function displayUsers(resources, opts, context) {
    const options = {
        message: getContextMessage('Users', context),
        headers: ['User', 'Description', 'Org', 'Owner', 'Groups', 'Created'],
        fields: ['name', 'description', 'org.properties.fqon', 'owner.name', 'properties.groups', 'created.timestamp'],
        sortField: 'name',
    }
    displayResource(options, opts, resources);
}

function displayGroups(resources, opts, context) {
    const options = {
        message: getContextMessage('Groups', context),
        headers: ['Group', 'ID', 'Description', 'Org', 'Owner', 'Users'],
        fields: ['name', 'id', 'description', 'org.properties.fqon', 'owner.name', 'properties.num_users'],
        sortField: 'name',
    }
    resources = util.cloneObject(resources);
    resources.map(r => {
        r.properties.num_users = String(r.properties.users.length);
    });

    displayResource(options, opts, resources);
}

function displayApiEndpoints(resources, opts, context) {
    const options = {
        message: getContextMessage('API Endpoints', context),
        headers: [
            'Name',
            'Description',
            'Resource Path',
            'Type',
            'Security',
            'Synchronous',
            'Methods',
            'Owner'
        ],
        fields: [
            'name',
            'description',
            'properties.api_path',
            'properties.implementation_type',
            'properties.plugins.gestaltSecurity.enabled',
            'properties.synchronous',
            'properties.methods',
            'owner.name'
        ],
        sortField: 'description',
    }

    resources = util.cloneObject(resources);
    resources.map(r => {
        r.properties.api_path = `/${r.properties.parent.name}${r.properties.resource}`
    });

    displayResource(options, opts, resources);
}

function displayProviders(resources, opts, context) {
    const options = {
        message: getContextMessage('Providers', context),
        headers: ['Provider', 'Description', 'Type', 'Org', 'Owner', 'Parent', /*'Parent Type', 'Created'*/],
        fields: ['name', 'description', 'resource_type', 'org.properties.fqon', 'owner.name', 'properties.parent.name', /*'properties.parent.typeId', created.timestamp'*/],
        sortField: 'name',
    }
    resources = util.cloneObject(resources);
    for (let item of resources) {
        item.resource_type = item.resource_type.replace(/Gestalt::Configuration::Provider::/, '')
        if (item.description) {
            if (item.description.length > 20) {
                item.description = item.description.substring(0, 20) + '...';
            }
        }
    }
    displayResource(options, opts, resources);
}

function displayVolumes(resources, opts, context) {
    const options = {
        message: getContextMessage('Volumes', context),
        headers: ['Volume', 'Size', 'Config', 'External ID'],
        fields: ['name', 'properties.size', 'properties.config', 'properties.external_id'],
        sortField: 'name',
    }
    displayResource(options, opts, resources);
}

function displayPolicies(resources, opts, context) {
    const options = {
        message: getContextMessage('Policies', context),
        headers: ['Policy', 'Description', 'Rules'],
        fields: ['name', 'description', 'num_rules'],
        sortField: 'name',
    }

    resources = util.cloneObject(resources);
    resources.map(r => {
        r.num_rules = `(${r.properties.rules.length} rules)`
    })

    displayResource(options, opts, resources);
}

function displayPolicyRules(resources, opts, context) {
    const options = {
        message: getContextMessage('Policy Rules', context),
        headers: ['Policy', 'Policy Rule', 'Description', 'Type'],
        fields: ['properties.parent.name', 'name', 'description', 'resource_type'],
        sortField: 'properties.parent.name',
    }

    resources = util.cloneObject(resources);
    resources.map(r => {
        r.resource_type = r.resource_type.replace(/Gestalt::Resource::Rule::/, '')
    })

    displayResource(options, opts, resources);
}

function displayJobs(resources, opts, context) {
    const options = {
        message: getContextMessage('Jobs', context),
        headers: ['Container', 'Description', 'Status', 'Image', 'CPU', 'Memory', 'Owner', /*'FQON', 'ENV',*/ 'Provider'],
        fields: ['name', 'description', 'properties.status', 'properties.image', 'properties.cpus', 'properties.memory', 'owner.name', /*'org.properties.fqon', 'environment.name',*/ 'properties.provider.name'],
        sortField: 'name',
    }

    // Transform for display
    for (let item of resources) {
        if (item.description) {
            if (item.description.length > 20) {
                item.description = item.description.substring(0, 20) + '...';
            }
        }
        // item.fqon = fqon;
        // item.running_instances = `${item.properties.tasks_running || 0} / ${item.properties.num_instances}`;
    }

    displayResource(options, opts, resources);
}
