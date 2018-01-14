#!/usr/bin/env node

exports.run = (opts, callback) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    go();

    async function go() {

        const res = await gestalt.fetchProviders(null, opts.type);

        const options = {
            mode: opts.mode || 'autocomplete',
            message: opts.message || "Select Provider",
            fields: ['name', /*'description',*/ 'resource_type', 'org.properties.fqon', 'owner.name', 'id'/*'created.timestamp'*/],
            sortBy: 'name',
            resources: res.map(item => {
                item.resource_type = item.resource_type.replace(/Gestalt::Configuration::Provider::/, '');
                return item;
            })
        }

        selectResource.run(options, selection => {
            if (callback) callback(selection);
        });
    }
}