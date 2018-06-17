const cmd = require('../lib/cmd-base');
exports.command = '*'
exports.handler = cmd.handler(async function (argv) {
    cmd.debug(argv)
    if (argv._[0]) {
        throw Error(`Invalid command: '${argv._[0]}'. Try running 'fog --help'`);
    }
    
    throw Error(`Invalid command. Try running 'fog --help'`);
});
