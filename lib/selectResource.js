'use strict';

//TODO: Move to /lib dir and rename to selectResourceUI
exports.run = (argv, callback) => {
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
        org: {
            message: "Select Org",
            valueKey: 'value',
            fields: ['description', 'properties.fqon', 'owner.name'],
            returnValue: "org",
            fetchFunction: () => {
                var res = gestalt.fetchOrgs();
                res.map(r => {
                    // to be returned by selection
                    r.value = {
                        id: r.id,
                        name: r.name,
                        description: r.description,
                        fqon: r.properties.fqon
                    };
                    r.fqon = r.properties.fqon
                });
                return sortBy(res, 'fqon');
            }
        },

        ws: {
            message: "Select Workspace",
            valueKey: 'value',
            fields: ['description', 'name', 'fqon', 'owner.name'],
            returnValue: "workspace",
            fetchFunction: () => {
                var res = gestalt.fetchWorkspaces([gestalt.getState().org.fqon]);

                // decorate items
                res.map(r => {
                    // to be returned by selection
                    r.value = {
                        id: r.id,
                        name: r.name,
                        description: r.description
                    };

                    // alter for display
                    r.fqon = r.org.properties.fqon;
                    r.name = `${r.name}`;
                });
                return sortBy(res, 'description');
            }
        },

        env: {
            message: "Select Environment",
            valueKey: 'value',
            fields: ['description', 'name', 'path', 'owner_name'],
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
    }

    options.wsall = {
        autocomplete: options.ws.autocomplete,
        message: options.ws.message,
        valueKey: options.ws.valueKey,
        fields: options.ws.fields,
        returnValue: options.ws.returnValue,
        fetchFunction: () => {
            var res = gestalt.fetchWorkspaces(gestalt.fetchOrgFqons());

            // decorate items
            res.map(r => {
                // to be returned by selection
                r.value = {
                    id: r.id,
                    name: r.name,
                    description: r.description
                };

                // alter for display
                r.owner_name = r.owner.name;
                r.path = `/${r.fqon}`;
                r.name = `:${r.name}`;
            });
            return sortBy(res, 'description');
        }
    };

    // Main

    selectResource.run(options.org, answers => {
        gestalt.setCurrentOrg(answers);
        console.log();

        selectResource.run(options.ws, answers => {
            gestalt.setCurrentWorkspace(answers);
            console.log();

            selectResource.run(options.env, answers => {
                gestalt.setCurrentEnvironment(answers);
                console.log();
            });
        });
    });
}
