'use strict';

exports.run = (container, callback) => {
    const selectResource = require('./selectResourceUI');
    const options = {
        mode: 'autocomplete',
        message: "Select Container Instance",
        fields: ['id', 'ipAddresses[0].ipAddress', 'startedAt'],
        sortBy: 'id',
        fetchFunction: () => {
            const res = container.properties.instances || [];
            return res;
        }
    }

    selectResource.run(options, answers => {
        callback(answers);
    });
}