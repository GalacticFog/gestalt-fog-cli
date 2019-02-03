const { gestalt } = require('gestalt-fog-sdk')
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const chalk = require('../lib/chalk');

module.exports = {
    doExportHierarchy,
    doExportEnviornmentResources
}

// Public functions

async function doExportHierarchy(context, resourceTypes, basePath, format = 'yaml', raw = false) {

    basePath = basePath || toSlugAllowingDots(gestalt.getHost());

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
            try {
                const exportPath = dirs.join(path.sep);
                const orgContext = { org: { fqon: org.properties.fqon } };
                await doExportOrg(orgContext, org, exportPath, resourceTypes, format, raw);
            } catch (err) {
                console.error(chalk.red(`Error: ${err.stack}`));
            }
        }
    }
}

async function doExportEnviornmentResources(envContext, resourceTypes, basePath = '.', format = 'yaml', raw = false) {

    // First, fetch resources of specified types
    const resources = await doFetchResources(envContext, resourceTypes);

    console.log('  (found ' + resources.length + ' resources)');

    for (const r of resources) {
        await exportSingleEnvironmentResource(envContext, r, basePath, format, raw);
    }
}

// Private functions

async function doExportOrg(orgContext, org, basePath, resourceTypes, format = 'yaml', raw = false) {

    console.log()
    console.log(chalk.bold(`Exporting org '${orgContext.org.fqon}'...`));

    // Export the org
    await exportSingleEnvironmentResource(orgContext, org, basePath, format, raw);

    const workspaces = await gestalt.fetchOrgWorkspaces([orgContext.org.fqon]);

    for (const ws of workspaces) {

        const wsContext = getWorkspaceContext(orgContext, ws);
        const wsBasePath = basePath + path.sep + toSlugAllowingDots(orgContext.org.fqon);

        await doExportWorkspace(wsContext, ws, wsBasePath, resourceTypes, format, raw);
    }
}

async function doExportWorkspace(wsContext, ws, basePath, resourceTypes, format = 'yaml', raw = false) {

    console.log()
    console.log(chalk.bold(`Exporting workspace '${wsContext.org.fqon}/${ws.name}'...`));

    // Export the org
    await exportSingleEnvironmentResource(wsContext, ws, basePath, format, raw);

    const environments = await gestalt.fetchWorkspaceEnvironments(wsContext);

    for (const env of environments) {

        const envContext = getEnvironmentContext(wsContext, env);
        const envBasePath = basePath + path.sep + toSlug(ws.name);

        await doExportEnvironment(envContext, env, envBasePath, resourceTypes, format, raw);
    }
}

async function doExportEnvironment(envContext, env, basePath, resourceTypes, format = 'yaml', raw = false) {

    console.log()
    console.log(chalk.bold(`Exporting workspace '${envContext.org.fqon}/${envContext.workspace.name}/${env.name}'...`));

    // Export the org
    await exportSingleEnvironmentResource(envContext, env, basePath, format, raw);

    const envBasePath = basePath + path.sep + env.name;

    await doExportEnviornmentResources(envContext, resourceTypes, envBasePath, format, raw);
}

async function exportSingleEnvironmentResource(envContext, res, basePath, format, raw) {

    // First, render the resources portable, stripping environment-specific
    // information, and rendering provider ID's as provider names
    if (!raw) {
        res = await makeResourcePortable(res, envContext);
    }

    // Next, Write the resources to the filesystem (Note: a resource may be more than one file)
    writeResourceToFilesystem(res, basePath, format);
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
        try {
            const res = await gestalt.fetchEnvironmentResources(type, envContext);
            resources = resources.concat(res);
        } catch (err) {
            console.log(chalk.red(`Error: ${err.error}, skipping resource type '${type}'`));
        }
    }

    return resources;
}

async function makeResourcePortable(res, context) {

    // Delete info
    res = stripEnvironmentSpecificInfo(res);

    res = await dereferenceProviders(res, context);

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

        // Container properties
        delete res.properties.instances;
        delete res.properties.age;
        delete res.properties.status;
        delete res.properties.tasks_healthy;
        delete res.properties.tasks_unhealthy;
        delete res.properties.tasks_running;
        delete res.properties.tasks_staged;
        delete res.properties.external_id;
        if (res.properties.port_mappings) {
            for (const pm of res.properties.port_mappings) {
                if (pm.service_address) {
                    delete pm.service_address.host;
                }
            }
        }
    }
    return res;
}

async function dereferenceProviders(res, context) {
    // Clone object
    res = JSON.parse(JSON.stringify(res));

    if (res.properties && res.properties.provider && res.properties.provider.id) {

        const providerName = await getProviderName(res.properties.provider.id, context);
        if (providerName) {
            modifyProviderPayload(res, providerName);
        } else {
            console.error(chalk.yellow(`Warning: Resource '${res.name}': Could not resolve provider '${res.properties.provider.name}' with ID ${res.properties.provider.id}`));
            if (res.properties.provider.name) {
                // Use the provider name
                modifyProviderPayload(res, res.properties.provider.name);
            }
        }
    }

    return res;
}

function modifyProviderPayload(res, value) {
    res.properties.provider.id = `#{Provider ${value}}`;
    delete res.properties.provider.name;
    delete res.properties.provider.resource_type;
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

// function writeResourcesToFilesystem(resources, basePath, format) {
//     for (res of resources) {
//         writeResourceToFilesystem(res, basePath, format);
//     }
// }

function writeResourceToFilesystem(res, basePath, format = 'yaml') {

    basePath = basePath || '.';

    const filename = buildFilename(res) + '.' + format;

    const additionalExports = processResource(res);

    // Write any exports the file may have
    for (const data of additionalExports) {
        writeFile(basePath + path.sep + data.basePath, data.filename, data.contents);
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
        'Gestalt::Configuration::AppDeployment': 'appdeployment'
    };

    if (!resource.resource_type) {
        throw Error('Resource is missing resource_type');
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
