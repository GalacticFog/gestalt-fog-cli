exports.run = async (selectOpts, state) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    if (!state) state = gestalt.getState();

    const res = await gestalt.fetchOrgWorkspaces([state.org.fqon]);

    // Filter
    if (selectOpts) {
        if (selectOpts.filter) {
            res = res.filter(selectOpts.filter);
        }
    }


    const options = {
        mode: 'autocomplete',
        message: "Select Workspace",
        fields: ['description', 'name', 'fqon', 'owner.name'],
        sortBy: 'description',
        resources: res.map(r => {
            // r.fqon = r.org.properties.fqon;
            // r.name = `${r.name}`;
            return r;
        })
    }

    return selectResource.run(options);
}
