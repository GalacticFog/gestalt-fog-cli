const { gestalt, gestaltSession } = require('gestalt-fog-sdk');
const chalk = require('./chalk');

exports.run = (context) => {
    console.log(this.contextString(context));
}

exports.contextString = (context, opts) => {
    if (opts && opts.raw) {
        return gestaltSession.getContextPath();
    }

    const user = gestaltSession.getSessionConfig().username;

    let s =  chalk.bold.blue(user) + ' @ ' + chalk.bold.green(gestalt.getHost());
    if (context && context.org) {
        s += ` / ${chalk.green(context.org.fqon)}`;
        if (context.workspace) {
            let value = context.workspace.description || context.workspace.name
            s += ` / ${chalk.green(value)}`;
        }
        if (context.environment) {
            let value = context.environment.description || context.environment.name
            s += ` / ${chalk.green(value)}`;
        }
    }
    return s;
}