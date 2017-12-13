#!/usr/bin/env node

exports.run = (opts, callback) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    let options = {
        mode: 'autocomplete',
        message: "Select Container(s)",
        fields: ['name', 'properties.status', 'properties.image', 'running_instances', 'owner.name', 'properties.provider.name'],
        sortBy: 'name',
        fetchFunction: () => {

            const res = gestalt.fetchContainers();

            // enhance for display
            res.map(r => {
                r.running_instances = `${r.properties.tasks_running} / ${r.properties.num_instances}`,
                r.fqon = r.org.properties.fqon
            })
            return res;
        }
    }

    // merge in user specified options
    options = Object.assign(options, opts);

    selectResource.run(options, selection => {
        if (callback) callback(selection);
    });
}

