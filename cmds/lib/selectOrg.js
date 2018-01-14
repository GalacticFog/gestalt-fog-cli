#!/usr/bin/env node
exports.run = (callback) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    go();

    async function go() {

        const res = await gestalt.fetchOrgs();

        const options = {
            mode: 'autocomplete',
            message: "Select Org",
            fields: ['description', 'properties.fqon', 'owner.name'],
            sortBy: 'fqon',
            resources: res.map(r => {
                r.fqon = r.properties.fqon;
                return r;
            })
        };
        if (callback) {
            selectResource.run(options, selection => {
                if (callback) callback(selection);
            });
        } else {
            return selectResource.run(options);
        }
    }
}