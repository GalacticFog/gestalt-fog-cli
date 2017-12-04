#!/usr/bin/env node
exports.run = (callback) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    const options = {
        mode: 'autocomplete',
        message: "Select Workspace",
        fields: ['description', 'name', 'fqon', 'owner.name'],
        sortBy: 'description',
        fetchFunction: () => {
            const res = gestalt.fetchWorkspaces([gestalt.getState().org.fqon]);

            // enhance payloads for display
            res.map(r => {
                r.fqon = r.org.properties.fqon;
                r.name = `${r.name}`;
            });
            return res;
        }
    };

    selectResource.run(options, selection => {
        if (callback) callback(selection);
    });
}
