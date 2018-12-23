exports.run = async (selectOpts, res, context) => {
    const { gestalt } = require('gestalt-fog-sdk')
    const selectResource = require('./selectResourceUI');

    if (!selectOpts) selectOpts = {};
    if (!context) throw Error(`Missing context`);

    res = res || await gestalt.fetchEnvironmentApis(context);

    // Filter
    if (selectOpts.filter) {
        res = res.filter(selectOpts.filter);
    }

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