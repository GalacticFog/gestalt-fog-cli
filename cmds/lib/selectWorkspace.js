exports.run = async (selectOpts, context) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    if (!context) context = gestalt.getContext();

    const res = await gestalt.fetchOrgWorkspaces([context.org.fqon]);

    // Filter
    if (selectOpts) {
        if (selectOpts.filter) {
            res = res.filter(selectOpts.filter);
        }
    }


    const options = {
        mode: 'autocomplete',
        message: "Select Workspace",
        fields: ['name', 'description', 'fqon', 'owner.name'],
        sortBy: 'name',
        resources: res.map(r => {
            // r.fqon = r.org.properties.fqon;
            // r.name = `${r.name}`;
            return r;
        })
    }

    if (selectOpts.includeNoSelection) {
        // Add the 'null' selection
        options.resources = [null].concat(options.resources);
    }

    return selectResource.run(options);
}
