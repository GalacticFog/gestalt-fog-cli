#!/usr/bin/env node
exports.run = (callback) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    go();

    async function go() {

        const res = await gestalt.fetchWorkspaces([gestalt.getState().org.fqon]);

        const options = {
            mode: 'autocomplete',
            message: "Select Workspace",
            fields: ['description', 'name', 'fqon', 'owner.name'],
            sortBy: 'description',
            resources: res.map(r => {
                // r.fqon = r.org.properties.fqon;
                // r.name = `${r.name}`;
                return r;
            })
        }

        selectResource.run(options, selection => {
            if (callback) callback(selection);
        });
    }
}
