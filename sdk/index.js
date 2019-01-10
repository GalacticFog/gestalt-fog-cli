const gestalt = require('./lib/gestalt');
const templateResolver = require('./lib/template-resolver');
const contextResolver = require('./lib/context-resolver');
const actions = require('./lib/actions');
const meta = require('./lib/gestalt/metaclient');
const security = require('./lib/gestalt/securityclient');
const gestaltContext = require('./lib/gestalt-context');

module.exports = {
    gestalt,
    gestaltContext,
    actions,
    contextResolver,
    ...templateResolver,
    meta,
    security
};