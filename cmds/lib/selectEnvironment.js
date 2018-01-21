exports.run = async (selectOpts, state) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    if (!state) state = gestalt.getState();

    let res = await gestalt.fetchWorkspaceEnvironments(state);

    // Filter
    if (selectOpts) {
        if (selectOpts.filter) {
            res = res.filter(selectOpts.filter);
        }
    }

    const fqon = state.org.fqon;
    const ws = state.workspace;

    // enhance payload
    for (let r of res) {
        r.owner_name = r.owner.name;
        r.path = `${fqon}/${ws.name}`;
        r.name = `${r.name}`;
    }

    const options = {
        mode: 'autocomplete',
        message: "Select Environment",
        fields: ['description', 'name', 'path', 'owner_name'],
        sortBy: 'description',
        resources: res
    }

    return selectResource.run(options);
}