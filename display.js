#!/usr/bin/env node

const gestalt = require('./gestalt')
const displayResource = require('./displayResourceUI');

const profiles = {};

profiles.org = {
    message: "Select Org",
    headers: ['Description of the resource', 'Path', 'Owner'],
    fields: ['description', 'path', 'owner_name'],
    sortField: 'description',
}
profiles.ws = {
    message: "Select Workspace",
    headers: ['Description', 'Name', 'Path', 'Owner'],
    fields: ['description', 'name', 'path', 'owner_name'],
    sortField: 'description',
}

profiles.env = {
    message: "Select Environment",
    headers: ['Description', 'Name', 'Path', 'Owner'],
    fields: ['description', 'name', 'path', 'owner_name'],
    sortField: 'description',
}

profiles.containers = {
    message: "Select Environment",
    headers: ['Description', 'Name', 'Path', 'Image', 'Owner'],
    fields: ['description', 'name', 'path', 'properties.image', 'owner_name'],
    sortField: 'description',
}


if (process.argv.length > 2) {
    let type = process.argv[2];
    let options;
    let resources;
    let fqon = gestalt.getState().org.fqon;

    switch (type) {
        case 'org':
            options = profiles.org;
            resources = gestalt.fetchOrgs();
            resources.map(r => {
                // to be returned by selection
                r.owner_name = r.owner.name;
                r.path = `/${r.fqon}`;
            });
            break;

        case 'ws':
            options = profiles.ws;
            resources = gestalt.fetchWorkspaces([fqon]);
            resources.map(r => {
                r.owner_name = r.owner.name;
                r.path = `/${r.fqon}`;
                r.name = `:${r.name}`;
            });
            break;

        case 'allws':
            options = profiles.ws;
            resources = gestalt.fetchWorkspaces(gestalt.fetchOrgFqons());
            resources.map(r => {
                r.owner_name = r.owner.name;
                r.path = `/${r.fqon}`;
                r.name = `:${r.name}`;
            });
            break;

        case 'env':
            options = profiles.env;
            ws = gestalt.getState().workspace;
            resources = gestalt.fetchOrgs();
            resources.map(r => {
                r.owner_name = r.owner.name;
                r.path = `/${fqon}/${ws.name}`;
                r.name = `:${r.name}`;
            });
            break;

        case 'containers':
            options = profiles.containers;
            ws = gestalt.getState().workspace;
            env = gestalt.getState().environment;
            resources = gestalt.fetchContainers();
            resources.map(r => {
                r.owner_name = r.owner.name;
                r.path = `/${fqon}/${ws.name}`;
                r.name = `:${r.name}`;
            });
            break;
    }

    displayResource.run(options, resources);
}    