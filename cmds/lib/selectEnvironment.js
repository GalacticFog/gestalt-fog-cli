#!/usr/bin/env node
exports.run = (selectOpts, callback) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    go();

    async function go() {

        const fqon = gestalt.getState().org.fqon;
        const ws = gestalt.getState().workspace;

        let res = await gestalt.fetchEnvironments();

        const options = {
            mode: 'autocomplete',
            message: "Select Environment",
            fields: ['description', 'name', 'path', 'owner_name'],
            sortBy: 'description',
            fetchFunction: () => {

                // Filter
                if (selectOpts) {
                    if (selectOpts.filter) {
                        res = res.filter(selectOpts.filter);
                    }
                }

                // enhance payload
                for (let r of res) {
                    r.owner_name = r.owner.name;
                    r.path = `${fqon}/${ws.name}`;
                    r.name = `${r.name}`;
                }
                return res;
            }
        }

        selectResource.run(options, selection => {
            if (callback) callback(selection);
        });
    }
};