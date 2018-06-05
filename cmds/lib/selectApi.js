exports.run = async (selectOpts, context) => {
    const gestalt = require('./gestalt')
    const selectResource = require('./selectResourceUI');

    if (!selectOpts) selectOpts = {};
    if (!context) context = gestalt.getContext();

    let res = await gestalt.fetchEnvironmentApis(context);

    // Filter
    if (selectOpts.filter) {
        res = res.filter(selectOpts.filter);
    }

    const fqon = context.org.fqon;
    const ws = context.workspace;

    const options = {
        mode: 'autocomplete',
        message: "Select API",
        fields: [
            'name',
            'org.properties.fqon',
            'owner.name',
            'id'
        ],
        sortBy: 'description',
        resources: res
    }

    return selectResource.run(options);
}