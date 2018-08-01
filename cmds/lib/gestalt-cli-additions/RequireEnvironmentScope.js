
// exports = {
//     'RequireEnvironmentScope': applyRequireEnvironmentScope
// }

module.exports = applyRequireEnvironmentScope;

const util = require('../context-resolver');

const { cli, ui, out, debug, gestaltContext } = require('../gestalt-cli');


function applyRequireEnvironmentScope(command, handlers) {

    setEnvironmentScope(command);
    setEnvironmentScopeHandlers(handlers);

    // Supporting functions

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
        const handler = async (argv) => {

            debug(`This command requires environment scope.`)

            const context = gestaltContext.getContext();

            await util.requireOrgArg(argv, context);
            await util.requireEnvironmentArg(argv, context);
            await util.requireEnvironmentArg(argv, context);

        };

        handlers.push(handler);
    }
}