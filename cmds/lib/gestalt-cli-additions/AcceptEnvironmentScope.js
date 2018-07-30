
// exports = {
//     'AcceptEnvironmentScope': applyAcceptEnvironmentScope
// }

module.exports = applyAcceptEnvironmentScope;

const util = require('../cmd-utils');

function applyAcceptEnvironmentScope(command, handlers) {

    setEnvironmentScope(command);
    setEnvironmentScopeHandlers(handlers);
}

function setEnvironmentScope(command) {
    const options = {
        org: {
            description: "Sets the org"
        },
        workspace: {
            description: "Sets the workspace"
        },
        environment: {
            description: "Sets the environment"
        },
        context: {
            description: "Sets the scope"
        }
    }
    command.builder = Object.assign(command.builder, options)
}

function setEnvironmentScopeHandlers(handlers) {
    const handler = (argv) => {

        debug(`This command accepts environment scope.`)

    };

    handlers.push(handler);
}
