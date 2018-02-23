const selectResource = require('./selectResourceUI');

exports.run = (message, optionsList) => {
    if (optionsList.length == 0) throw Error('No options specified');
    const res = optionsList.map(o => { return { name: o } });
    let options = {
        mode: 'checkbox',
        message: message,
        fields: ['name'],
        sortBy: 'name',
        resources: res
    }

    return selectResource.run(options).then(arr => arr.map(a => a.name));
}
