const gestalt = require('./lib/gestalt');
const templateResolver = require('./lib/template-resolver');
const contextResolver = require('./lib/context-resolver');
const actions = require('./lib/actions');
const meta = require('./lib/gestalt/metaclient');
const security = require('./lib/gestalt/securityclient');
const gestaltSession = require('./lib/gestalt-session');

module.exports = {
    gestalt,
    gestaltSession,
    actions,
    contextResolver,
    ...templateResolver,
    meta,
    security
};