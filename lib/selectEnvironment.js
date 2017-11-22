#!/usr/bin/env node
exports.run = (callback) => {

    const argv = require('yargs').argv
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    selectResource.mode = 'autocomplete';

    function sortBy(arr, key) {
        return arr.sort((a, b) => {
            if (a[key] < b[key]) { return -1; }
            if (a[key] > b[key]) { return 1; }
            return 0;
        })
    }

    const options = {
        message: "Select Environment",
        valueKey: 'value',
        fields: ['description', 'name', 'path', 'owner_name'],
        // fields: ['name', 'description', 'properties.environment_type', 'org.properties.fqon', 'owner.name'],
        returnValue: "environment",
        fetchFunction: () => {

            let fqon = gestalt.getState().org.fqon;
            let ws = gestalt.getState().workspace;

            var res = gestalt.fetchEnvironments();
            res.map(r => {
                r.value = {
                    id: r.id,
                    name: r.name,
                    description: r.description
                };

                r.owner_name = r.owner.name;
                r.path = `${fqon}/${ws.name}`;
                r.name = `${r.name}`;
            });
            return sortBy(res, 'description');
        }
    }

    selectResource.run(options, answers => {
        // gestalt.setCurrentEnvironment(answers);
        if (callback) callback(answers);
    });
}