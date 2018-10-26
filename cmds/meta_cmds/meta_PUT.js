const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
const { renderResourceTemplate } = require('../lib/template-resolver');
const meta = require('../lib/gestalt/metaclient');

exports.command = 'PUT [path]'
exports.desc = 'HTTP functions'
exports.builder = {
    file: {
        alias: 'f',
        description: 'resource definition file'
    },
}

exports.handler = cmd.handler(async function (argv) {
    const urlPath = argv.path;

    if (!argv.file) {
        throw Error('missing --file parameter');
    }

    console.log(`Loading resource spec from file ${argv.file}`);
    let spec = cmd.loadObjectFromFile(argv.file);

    // Resolve parameters
    spec = await renderResourceTemplate(spec, {}, undefined);

    const response = await meta.PUT(urlPath, spec);
    try {
        console.log(JSON.stringify(response, null, 2));
    } catch (err) {
        console.log(response);
    }
});
