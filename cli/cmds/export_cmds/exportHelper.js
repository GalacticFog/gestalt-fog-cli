const { gestalt } = require('gestalt-fog-sdk')
const { getEntitlementsByIdentities } = require('./exportEntitlementsHelper');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const chalk = require('../lib/chalk');
const debug = require('../lib/debug').debug;

const shortResourceTypes = {
    'Gestalt::Resource::Node::Lambda': 'lambda',
    'Gestalt::Resource::Container': 'container',
    'Gestalt::Resource::Api': 'api',
    'Gestalt::Resource::Environment': 'environment',
    'Gestalt::Resource::Workspace': 'workspace',
    'Gestalt::Resource::Organization': 'org',
    'Gestalt::Resource::User': 'user',
    'Gestalt::Resource::Group': 'group',
    'Gestalt::Resource::Volume': 'volume',
    'Gestalt::Resource::Policy': 'policy',
    'Gestalt::Resource::ApiEndpoint': 'apiendpoint',
    'Gestalt::Resource::Rule::Event': 'eventrule',
    'Gestalt::Resource::Rule::Limit': 'limitrule',
    'Gestalt::Resource::Configuration::DataFeed': 'datafeed',
    'Gestalt::Resource::Spec::StreamSpec': 'streamspec',
    'Gestalt::Resource::Secret': 'secret',
    'Gestalt::Configuration::AppDeployment': 'appdeployment',
    'Fog::GroupMembership': 'groupmembership',
    'Fog::Entitlements::User': 'entitlements-user',
    'Fog::Entitlements::Group': 'entitlements-group',
};

module.exports = {
    doExportHierarchy,
    doExportEnviornmentResources,
    getDefaultExportDirectory
}

// Public functions

function getDefaultExportDirectory(raw = false) {
    return toSlugAllowingDots(gestalt.getHost()) + (raw ? '-raw' : '')
}

async function doExportHierarchy(context, resourceTypes, basePath, format = 'yaml', raw = false) {

    basePath = basePath || getDefaultExportDirectory(raw);

    const dirs = [basePath];

    if (context.org) {
        if (context.workspace) {
            dirs.push(context.org.fqon);
            if (context.environment) {
                dirs.push(context.workspace.name);
                const exportPath = dirs.join(path.sep);
                const env = await gestalt.fetchEnvironment(context);
                return await doExportEnvironment(context, env, exportPath, resourceTypes, format, raw);
            }
            const exportPath = dirs.join(path.sep);
            const ws = await gestalt.fetchWorkspace(context);
            return await doExportWorkspace(context, ws, exportPath, resourceTypes, format, raw);
        }

        const exportPath = dirs.join(path.sep);
        const org = await gestalt.fetchOrg(context);
        return await doExportOrg(context, org, exportPath, resourceTypes, format, raw);
    } else {
        // root context
        const orgs = await gestalt.fetchOrgs();
        for (const org of orgs) {
            const exportPath = dirs.join(path.sep);
            const orgContext = { org: { fqon: org.properties.fqon } };
            try {
                await doExportOrg(orgContext, org, exportPath, resourceTypes, format, raw);
            } catch (err) {
                showError(err, orgContext, org);
            }
        }
    }
}

async function doExportEnviornmentResources(envContext, resourceTypes, basePath = '.', format = 'yaml', raw = false) {

    if (!raw) {
        exportContext(basePath, envContext);
    }

    // First, fetch resources of specified types
    const resources = await doFetchResources(envContext, resourceTypes);

    debug('  (found ' + resources.length + ' environment resources)');

    for (const r of resources) {
        try {
            await exportSingleEnvironmentResource(envContext, r, basePath, format, raw);
        } catch (err) {
            showError(err, envContext, r);
        }
    }
}

// Private functions

async function doExportOrg(orgContext, org, basePath, resourceTypes, format = 'yaml', raw = false) {

    console.log()
    console.log(chalk.bold(`Exporting org '${orgContext.org.fqon}' to '${basePath}'...`));

    if (!raw) {
        exportParentContext(basePath, orgContext);
    }

    // Export the Org resource
    await exportSingleEnvironmentResource(orgContext, org, basePath, format, raw);

    const orgBasePath = basePath + path.sep + toSlugAllowingDots(orgContext.org.fqon);

    if (orgContext.org.fqon == 'root') {
        await doExportUsersAndGroups(orgContext, orgBasePath, format, raw);
    }

    // Export common child resources (providers, entitlements, etc)
    await doExportResourcesCommonToOrgWorkspaceEnviornment(resourceTypes, orgContext, orgBasePath, format, raw);

    // Export the child workspaces
    const workspaces = await gestalt.fetchOrgWorkspaces([orgContext.org.fqon]);
    for (const ws of workspaces) {
        const wsContext = getWorkspaceContext(orgContext, ws);
        try {
            await doExportWorkspace(wsContext, ws, orgBasePath, resourceTypes, format, raw);
        } catch (err) {
            showError(err, wsContext, ws);
        }
    }
}

async function doExportWorkspace(wsContext, ws, basePath, resourceTypes, format = 'yaml', raw = false) {

    console.log()
    console.log(chalk.bold(`Exporting workspace '${wsContext.org.fqon}/${ws.name}'...`));

    if (!raw) {
        exportParentContext(basePath, wsContext);
    }

    // Export the Workspace resource
    await exportSingleEnvironmentResource(wsContext, ws, basePath, format, raw);

    const wsBasePath = basePath + path.sep + toSlug(ws.name);

    // Export common child resources (providers, entitlements, etc)
    await doExportResourcesCommonToOrgWorkspaceEnviornment(resourceTypes, wsContext, wsBasePath, format, raw);

    // Export the child environments
    const environments = await gestalt.fetchWorkspaceEnvironments(wsContext);
    for (const env of environments) {
        const envContext = getEnvironmentContext(wsContext, env);
        try {
            await doExportEnvironment(envContext, env, wsBasePath, resourceTypes, format, raw);
        } catch (err) {
            showError(err, envContext, env);
        }
    }
}

function showError(err, context, resource) {
    console.error(chalk.red(`Error: ${err.error}`));
    console.error(chalk.red(`  context: ` + getContextPath(context)));
    if (resource) {
        console.error(chalk.red(`  resource: ${resource.name} (${resource.resource_type})`));
    }
    debug(chalk.red(err.stack));
}

async function doExportEnvironment(envContext, env, basePath, resourceTypes, format = 'yaml', raw = false) {

    console.log()
    console.log(chalk.bold(`Exporting environment '${envContext.org.fqon}/${envContext.workspace.name}/${env.name}'...`));

    if (!raw) {
        exportParentContext(basePath, envContext);
    }

    // Export the Environment resource
    await exportSingleEnvironmentResource(envContext, env, basePath, format, raw);

    const envBasePath = basePath + path.sep + toSlug(env.name);

    // Export common child resources (providers, entitlements, etc)
    await doExportResourcesCommonToOrgWorkspaceEnviornment(resourceTypes, envContext, envBasePath, format, raw);

    // Export the environment's child resources
    await doExportEnviornmentResources(envContext, resourceTypes, envBasePath, format, raw);
}

async function exportSingleEnvironmentResource(envContext, res, basePath, format, raw) {

    // First, render the resources portable, stripping environment-specific
    // information, and rendering provider ID's as provider names
    if (!raw) {
        res = await makeResourcePortable(res, envContext);
    }

    // Next, Write the resources to the filesystem (Note: a resource may be more than one file)
    writeResourceToFilesystem(res, basePath, format, raw);
}

async function doExportUsersAndGroups(orgContext, basePath, format, raw) {
    const users = await gestalt.fetchUsers();
    const groups = await gestalt.fetchGroups();

    // const groupMemberships = createGroupMembershipSpecs(users, groups);
    // doExportResources(orgContext, groupMemberships, basePath, format, raw);

    doExportResources(orgContext, users, basePath, format, raw);
    doExportResources(orgContext, groups, basePath, format, raw);
}

// function createGroupMembershipSpecs(users, groups) {
//     const specs = [];
//     for (let group of groups) {
//         const spec = {
//             resource_type: 'Fog::GroupMembership',
//             name: group.name,
//             groups: []
//         }

//         if (group.properties && group.properties.users) {
//             const members = group.properties.users.map(u => u.name);
//             spec.groups.push({
//                 name: group.name,
//                 description: group.description,
//                 members: members
//             });
//         }

//         specs.push(spec);
//     }

//     return specs;
// }

async function doExportResourcesCommonToOrgWorkspaceEnviornment(resourceTypes, orgContext, orgBasePath, format, raw) {
    if (resourceTypes.includes('providers')) {
        await exportProviders(orgContext, orgBasePath, format, raw);
    }
    if (resourceTypes.includes('entitlements')) {
        await exportEntitlements(orgContext, orgBasePath, format, raw);
    }
}

async function exportProviders(context, basePath, format, raw) {
    const providers = await gestalt.fetchProviders(context, null, {});
    return doExportResources(context, providers, basePath, format, raw);
}

async function exportEntitlements(context, basePath, format, raw) {
    const entitlements = await getEntitlementsByIdentities(context);
    return doExportResources(context, entitlements, basePath, format, raw);
}

async function doExportResources(context, resources, basePath, format, raw) {
    for (let res of resources) {
        try {
            if (!raw) {
                res = await makeResourcePortable(res, context);
            }
            writeResourceToFilesystem(res, basePath, format, raw);
        } catch (err) {
            showError(err, context, res);
        }
    }
}

function exportParentContext(dir, context) {
    const parentPath = getParentPath(getContextPath(context));
    writeFile(dir, 'context', parentPath);
}

function exportContext(dir, context) {
    writeFile(dir, 'context', getContextPath(context));
}

function getParentPath(contextPath) {
    const pathElements = contextPath.split('/');
    pathElements.pop();
    const newPath = pathElements.join('/');
    return newPath == '' ? '/root' : newPath;
}

function getContextPath(context) {
    let contents = '/'
    if (context.org && context.org.fqon) {
        contents += context.org.fqon
        if (context.workspace && context.workspace.name) {
            contents += `/${context.workspace.name}`
            if (context.environment && context.environment.name) {
                contents += `/${context.environment.name}`
            }
        }
    } else {
        contents = '/root'
    }
    return contents;
}

function getWorkspaceContext(orgContext, ws) {
    orgContext = JSON.parse(JSON.stringify(orgContext));
    return {
        ...orgContext,
        workspace: {
            id: ws.id,
            name: ws.name
        }
    };
}

function getEnvironmentContext(wsContext, env) {
    wsContext = JSON.parse(JSON.stringify(wsContext));
    return {
        ...wsContext,
        environment: {
            id: env.id,
            name: env.name
        }
    };
}

async function doFetchResources(envContext, resourceTypes) {
    let resources = [];
    for (const type of resourceTypes) {
        if (type != 'entitlements' && type != 'providers') { // Skip entitlements and providers (they are handled separately)
            try {
                const res = await gestalt.fetchEnvironmentResources(type, envContext);
                resources = resources.concat(res);
            } catch (err) {
                console.log(chalk.red(`Error fetching '${type}' environment resources: ${err.error}`));
                console.error(chalk.red(`  context: ` + getContextPath(envContext)));
                debug(chalk.red(err.stack));
            }
        }
    }

    return resources;
}

async function makeResourcePortable(res, context) {

    // Delete info
    res = stripEnvironmentSpecificInfo(res);

    res = await dereferenceProviders(res, context);
    res = await dereferenceLinkedProviders(res, context);
    res = await dereferenceLambdas(res, context);
    res = await dereferenceContainers(res, context);
    res = await dereferenceApis(res, context);
    res = await dereferencePolicies(res, context);

    return res;
}

function stripEnvironmentSpecificInfo(res) {
    // Clone object
    res = JSON.parse(JSON.stringify(res));


    delete res.resource_state;
    delete res.id;
    delete res.org;
    delete res.owner;
    delete res.created;
    delete res.modified;
    if (res.properties) {
        delete res.properties.parent;
        delete res.properties.children; // for orgs
        delete res.properties.workspace; // for environments
        stripTypeSpecificInfo(res);
    }
    return res;
}

function stripTypeSpecificInfo(res) {
    stripContainerInfo(res);
    stripApiEndpointInfo(res);
    stripPolicyInfo(res);
    stripPolicyRuleInfo(res);
    stripGroupInfo(res);
}

function stripGroupInfo(res) {
    if (getResourceType(res) == 'group') {
        if (res.properties && res.properties.users) {
            for (let u of res.properties.users) {
                delete u.typeId;
                delete u.id;
                delete u.href;
            }
        }
    }
}

function stripContainerInfo(res) {
    if (getResourceType(res) == 'container') {
        delete res.properties.instances;
        delete res.properties.age;
        delete res.properties.status;
        delete res.properties.tasks_healthy;
        delete res.properties.tasks_unhealthy;
        delete res.properties.tasks_running;
        delete res.properties.tasks_staged;
        delete res.properties.external_id;
        delete res.properties.status_detail;
        delete res.properties.events;
        if (res.properties.port_mappings) {
            for (const pm of res.properties.port_mappings) {
                if (pm.service_address) {
                    delete pm.service_address.host;
                }
            }
        }
    }
}

function stripPolicyRuleInfo(res) {
    if (getResourceType(res) == 'limitrule') {
        delete res.properties.defined_at;
    }

    if (getResourceType(res) == 'eventrule') {
        delete res.properties.defined_at;
        if (res.properties.lambda) {
            delete res.properties.lambda.href
        }
    }
}

function stripApiEndpointInfo(res) {
    if (getResourceType(res) == 'apiendpoint') {
        delete res.properties.upstream_url;
        delete res.properties.public_url;
    }
}

function stripPolicyInfo(res) {
    if (getResourceType(res) == 'policy') {
        // delete the referenced child rules, because when creating resources
        // the reference starts from the rule to the policy
        delete res.properties.rules;
    }
}

async function dereferenceLinkedProviders(res, context) {
    // Clone object
    res = JSON.parse(JSON.stringify(res));
    if (res.properties && res.properties.linked_providers) {
        debug(`${res.name} has ${res.properties.linked_providers.length} linked providers`);
        for (let link of res.properties.linked_providers) {
            await dereferenceProviderLink(res.name, link, context);
        }
    }
    return res;
}

async function dereferenceProviderLink(resName, link, context) {
    const providerName = await getProviderName(link.id, context);
    if (providerName) {
        link.id = `#{Provider ${providerName}}`;
    } else {
        console.error(chalk.yellow(`Warning: Resource '${resName}': Could not resolve provider '${link.name}' with ID ${link.id}`));
        if (link.name) {
            // Use the provider name
            link.id = `#{Provider ${link.name}}`;
        }
    }

    delete link.resource_type;
    delete link.location;
    // delete link.type;
    delete link.typeId;

    if (link.locations) {
        // Just clear out locations - they aren't necessary
        link.locations = [];
    }
}

async function dereferenceProviders(res, context) {
    // Clone object
    res = JSON.parse(JSON.stringify(res));

    if (res.properties && res.properties.provider && res.properties.provider.id) {
        await dereferenceProviderLink(res.name, res.properties.provider, context);
        delete res.properties.provider.name; // Also delete provider name
    }

    // for providers with services
    if (res.properties && res.properties.services) {
        for (let svc of res.properties.services) {
            if (svc.container_spec && svc.container_spec.properties && svc.container_spec.properties.provider) {
                await dereferenceProviderLink(res.name, svc.container_spec.properties.provider, context);
            }
        }
    }

    return res;
}

// in-memory providers cache, so providers are only looked up once per export run
let providersCache = null;

async function getProviders(context) {
    if (!providersCache) {
        providersCache = await gestalt.fetchProviders(context);
    }
    return providersCache;
}

async function getProviderName(id, context) {
    const providers = await getProviders(context);
    const p = providers.find(p => id == p.id);
    if (p) {
        return p.name;
    }
    // throw Error(`Provider with id ${id} not found`);
    return null;
}

// in-memory providers cache, so providers are only looked up once per export run
let lambdasCache = null;

async function getLambdas() {
    if (!lambdasCache) {
        lambdasCache = await gestalt.fetchOrgLambdas(await gestalt.fetchOrgFqons());
    }
    return lambdasCache;
}

async function dereferenceLambdas(res) {
    // Clone object
    res = JSON.parse(JSON.stringify(res));

    if (res.resource_type == 'Gestalt::Resource::Rule::Event') {
        if (res.properties && res.properties.lambda && res.properties.lambda.id) {
            // Note this transforms
            // { lambda: { id: ID } } --->  { lambda: ID }
            res.properties.lambda = await dereferenceLambdaId(res.properties.lambda.id);
            // delete res.properties.lambda.typeId;
            // delete res.properties.lambda.name;
        }
    }

    if (res.resource_type == 'Gestalt::Resource::ApiEndpoint') {
        if (res.properties && res.properties.implementation_type == 'lambda') {
            res.properties.implementation_id = await dereferenceLambdaId(res.properties.implementation_id);
            delete res.properties.location_id;
        }
    }

    return res;
}

async function dereferenceLambdaId(id) {
    const lambdas = await getLambdas();
    const lambda = lambdas.find(l => l.id == id);
    if (lambda) {
        return `#{Lambda ${lambda.name}}`;
    } else {
        console.error(chalk.yellow(`Warning: Could not dereference Lambda ID ${id}`));
        return id;
    }
}

// in-memory providers cache, so providers are only looked up once per export run
let containersCache = null;

async function getContainers() {
    if (!containersCache) {
        containersCache = await gestalt.fetchOrgContainers(await gestalt.fetchOrgFqons());
    }
    return containersCache;
}

async function dereferenceContainers(res) {
    // Clone object
    res = JSON.parse(JSON.stringify(res));

    if (res.resource_type == 'Gestalt::Resource::ApiEndpoint') {
        if (res.properties && res.properties.implementation_type == 'container') {
            res.properties.implementation_id = await dereferenceContainerId(res.properties.implementation_id);
            delete res.properties.location_id;
        }
    }

    return res;
}

async function dereferenceContainerId(id) {
    const containers = await getContainers();
    const container = containers.find(c => c.id == id);
    if (container) {
        return `#{Container ${container.name}}`;
    } else {
        console.error(chalk.yellow(`Warning: Could not dereference Container ID ${id}`));
        return id;
    }
}

// in-memory apis cache, so apis are only looked up once per export run
let apisCache = null;

async function getApis() {
    if (!apisCache) {
        apisCache = await gestalt.fetchOrgApis(await gestalt.fetchOrgFqons());
    }
    return apisCache;
}

async function dereferenceApis(res, context) {
    // Clone object
    res = JSON.parse(JSON.stringify(res));

    if (getResourceType(res) == 'apiendpoint') {
        if (res.context && res.context.api && res.context.api.id) {
            res.context.api.id = await dereferenceApiId(res.context.api.id);
        }
    }
    return res;
}

async function dereferenceApiId(id) {
    const apis = await getApis();
    const api = apis.find(a => a.id == id);
    if (api) {
        return `#{Api ${api.name}}`;
    } else {
        console.error(chalk.yellow(`Warning: Could not dereference Api ID ${id}`));
        return id;
    }
}

// in-memory policies cache, so policies are only looked up once per export run
let policiesCache = null;

async function getPolicies() {
    if (!policiesCache) {
        policiesCache = await gestalt.fetchOrgPolicies(await gestalt.fetchOrgFqons());
    }
    return policiesCache;
}

async function dereferencePolicies(res, context) {
    // Clone object
    res = JSON.parse(JSON.stringify(res));

    if (getResourceType(res) == 'eventrule' || getResourceType(res) == 'limitrule') {
        if (res.context && res.context.policy && res.context.policy.id) {
            res.context.policy.id = await dereferencePolicyId(res.context.policy.id);
        }
    }
    return res;
}

async function dereferencePolicyId(id) {
    const policies = await getPolicies();
    const pol = policies.find(a => a.id == id);
    if (pol) {
        return `#{Policy ${pol.name}}`;
    } else {
        console.error(chalk.yellow(`Warning: Could not dereference Policy ID ${id}`));
        return id;
    }
}

function writeResourceToFilesystem(res, basePath, format = 'yaml', raw = false) {

    basePath = basePath || '.';

    const filename = buildFilename(res) + '.' + format;

    if (!raw) {
        const additionalExports = processResource(res);

        // Write any exports the file may have
        for (const data of additionalExports) {
            writeFile(basePath + path.sep + data.basePath, data.filename, data.contents);
        }
    }

    // Write the main file
    if (format == 'yaml') {
        const contents = yaml.safeDump(res) + '\n';
        writeFile(basePath, filename, contents);
    } else {
        const contents = JSON.stringify(res, null, 2) + '\n';
        writeFile(basePath, filename, contents);
    }
}

function writeFile(basePath, filename, contents) {
    const filepath = basePath + path.sep + filename;
    const fileExisted = fs.existsSync(filepath);
    mkdirs(basePath);
    fs.writeFileSync(filepath, contents);

    if (fileExisted) {
        console.log(chalk.blue(`  [Overwritten] ${filepath}`));
    } else {
        console.log(chalk.green(`  [New] ${filepath}`));
    }
}

function processResource(resource) {

    const additionalData = []

    if (getResourceType(resource) == 'lambda') {
        if (resource.properties && resource.properties.code) {
            const data = {
                basePath: 'src',
                filename: toSlug(resource.name) + getSourceExtension(resource),
                contents: extractCode(resource) + '\n'
            }

            additionalData.push(data);

            // Replace with code
            resource.properties.code = `#{LambdaSource ${data.basePath}/${data.filename}}`;
        }
    }

    return additionalData;
}

function buildFilename(resource) {
    if (getResourceType(resource) == 'org') {
        return getResourceType(resource) + '-' + toSlug(resource.properties.fqon);
    }
    return getResourceType(resource) + '-' + toSlug(resource.name);
}

function getResourceType(resource) {

    if (!resource.resource_type) {
        throw Error('Resource is missing resource_type');
    }

    if (resource.resource_type.startsWith('Gestalt::Configuration::Provider::')) {
        return 'provider';
    }

    if (resource.resource_type.startsWith('Gestalt::Action::')) {
        return 'action';
    }

    const type = shortResourceTypes[resource.resource_type];

    if (!type) {
        // fallback to other
        console.log(chalk.yellow(`Warning: Can't find type for '${resource.resource_type}`));
        return 'other';
    }
    return type;
}

function toSlug(s) {
    const _slugify_strip_re = /[^\w\s-]/g;
    const _slugify_hyphenate_re = /[-\s]+/g;

    s = s.replace(_slugify_strip_re, '-').trim().toLowerCase();
    s = s.replace(_slugify_hyphenate_re, '-');
    return s;
}

function toSlugAllowingDots(s) {
    const _slugify_strip_re = /[^\w|.\s-]/g;
    const _slugify_hyphenate_re = /[-\s]+/g;

    s = s.replace(_slugify_strip_re, '-').trim().toLowerCase();
    s = s.replace(_slugify_hyphenate_re, '-');
    return s;
}

function extractCode(resource) {
    if (resource.properties && resource.properties.code) {
        const buf = Buffer.from(resource.properties.code, 'base64');
        return buf.toString();
    }
    throw Error(`resource does not have 'code' property`);
}

function getSourceExtension(resource) {
    const defaultExtension = '.code';
    if (resource.properties && resource.properties.runtime) {
        const mapping = {
            'python': '.py',
            'nodejs': '.js',
            'nashorn': '.js',
            'java': '.java',
            'ruby': '.rb',
            'bash': '.sh',
        };
        return mapping[resource.properties.runtime] || '.' + toSlug(resource.properties.runtime);
    }
    return defaultExtension;
}

function mkdirs(targetDir) {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    const baseDir = '.';

    targetDir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);
        try {
            if (!fs.existsSync(curDir)) {
                fs.mkdirSync(curDir);
                // console.log(`Created ${curDir}`);
            }
        } catch (err) {
            if (err.code !== 'EEXIST') {
                throw err;
            }
        }
        return curDir;
    }, initDir);
}
