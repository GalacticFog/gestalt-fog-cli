exports.run = async (selectOpts, res, context) => {
    const { gestalt } = require('gestalt-fog-sdk')
    const selectResource = require('./selectResourceUI');

    if (!selectOpts) selectOpts = {};
    if (!context) throw Error(`Missing context`);

    res = res || await gestalt.fetchWorkspaceEnvironments(context);

    // Filter
    if (selectOpts.filter) {
        res = res.filter(selectOpts.filter);
    }

    const fqon = context.org.fqon;
    const ws = context.workspace;

    // enhance payload
    for (let r of res) {
        r.owner_name = r.owner.name;
        r.path = `${fqon}/${ws.name}`;
        r.name = `${r.name}`;
    }

    const options = {
        mode: 'autocomplete',
        message: "Select Environment",
        fields: ['name', 'description', 'path', 'owner_name'],
        sortBy: 'name',
        resources: res
    }

    if (selectOpts.includeNoSelection) {
        // Add the 'null' selection
        options.resources = [null].concat(options.resources);
    }

    return selectResource.run(options);
}