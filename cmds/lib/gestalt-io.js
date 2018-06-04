// const os = require('os');
const fs = require('fs');
const path = require('path');

exports.exportResource = (path, resource) => {
    path = path || '.';
    mkdirs(path);

    const file = path + '/' + toSlug(resource.name) + '.json'
    writeFile(file, resource);
}

exports.exportWorkspace = (path, ws) => {
    path = path || '.';
    path = `${path}/${ws.name}`
    this.exportResource(path, ws);
}

exports.exportEnvironment = (path, env, resources, exportOptions) => {
    path = path || '.';
    path = path + '/' + env.name;
    mkdirs(path);

    // Export the environment file
    this.exportResource(path, env);

    // Export each selected resource type
    for (let type of Object.keys(resources)) {
        this.exportResources(path, resources[type], type, exportOptions);
    }
}

exports.exportResources = (path, arr, type, exportOptions) => {
    if (!arr || arr.length == 0) {
        return;
    }
    path = path || '.';
    const dir = path + '/' + type;

    mkdirs(dir);

    // Build file paths
    const items = arr.map(obj => {
        return {
            resource: obj,
            file: dir + '/' + toSlug(obj.name) + '.json'
        }
    });

    // // Check if any files already exist, if so, abort
    // for (let item of items) {
    //     if (fs.existsSync(item.file)) {
    //         throw Error(`File '${item.file}' exists`);
    //     }
    // }

    // Export files
    for (let item of items) {
        if (exportOptions.portable) {
            removeNonportableInfo(item.resource);
        }

        writeFile(item.file, item.resource);
    }
}

function removeNonportableInfo(res) {
    delete res.resource_type;
    delete res.resource_state;
    delete res.id;
    delete res.org;
    delete res.owner;
    delete res.created;
    delete res.modified;
    if (res.properties) {
        delete res.properties.instances;
        delete res.properties.parent;
        delete res.properties.provider;
        delete res.properties.age;
        delete res.properties.status;
        delete res.properties.tasks_healthy;
        delete res.properties.tasks_unhealthy;
        delete res.properties.tasks_running;
        delete res.properties.tasks_staged;
        delete res.properties.external_id;
        if (res.properties.port_mappings) {
            for (let pm of res.properties.port_mappings) {
                if (pm.service_address) {
                    delete pm.service_address.host;
                }
            }
        }
    }
}

exports.loadResourceFromFile = (file) => {
    if (fs.existsSync(file)) {
        const contents = fs.readFileSync(file, 'utf8');
        return JSON.parse(contents);
    }
    throw Error(`'${file}' not found`);
}

function writeFile(file, resource) {
    let status = '[New]        ';
    if (fs.existsSync(file)) {
        status = '[Overwritten]';
    }

    const contents = `${JSON.stringify(resource, null, 2)}\n`;
    fs.writeFileSync(file, contents);
    console.log(`${status} ${file}`);
}

function toSlug(s) {
    const _slugify_strip_re = /[^\w\s-]/g;
    const _slugify_hyphenate_re = /[-\s]+/g;

    s = s.replace(_slugify_strip_re, '-').trim().toLowerCase();
    s = s.replace(_slugify_hyphenate_re, '-');
    return s;
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
            }
        } catch (err) {
            if (err.code !== 'EEXIST') {
                throw err;
            }
        }
        return curDir;
    }, initDir);
}
