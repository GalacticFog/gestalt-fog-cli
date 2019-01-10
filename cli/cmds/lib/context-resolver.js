const { contextResolver, gestaltContext } = require('gestalt-fog-sdk');
const { resolveContextPath } = contextResolver;
const selectHierarchy = require('../lib/selectHierarchy');

module.exports = {
    ...contextResolver,
    getContextFromPathOrPrompt,
}

async function getContextFromPathOrPrompt(path /*TODO: ,scope='any'*/) {
    let context = null;
    if (path) {
        context = await resolveContextPath(path);
    } else {
        // Load from state
        context = gestaltContext.getContext();

        if (!context.org || !context.org.fqon) {
            // No arguments, allow choosing interatively
            context = await selectHierarchy.chooseContext({ includeNoSelection: true });
        }
    }

    return context;
}
