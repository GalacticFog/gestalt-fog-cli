#!/usr/bin/env node
exports.run = (callback) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    const options = {
        mode: 'autocomplete',
        message: "Select Org",
        fields: ['description', 'properties.fqon', 'owner.name'],
        sortBy: 'fqon',
        fetchFunction: () => {
            const res = gestalt.fetchOrgs();

            // enhance payload
            res.map(r => {
                r.fqon = r.properties.fqon
            });
            return res;
        }
    };

    selectResource.run(options, selection => {
        if (callback) callback(selection.value);
    });
}