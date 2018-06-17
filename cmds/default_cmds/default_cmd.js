const cmd = require('../lib/cmd-base');
exports.command = '*'
exports.handler = cmd.handler(async function (argv) {
    throw Error(`Invalid command: '${argv._[0]} ${argv._[1]}'. Try running 'fog ${argv._[0]} --help'`);
});
