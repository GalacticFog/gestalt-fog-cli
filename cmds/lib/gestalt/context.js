const gestaltContext = require('../gestalt-context');
const getGestaltContext = gestaltContext.getContext;

exports.getCurrentOrg = () => {
    return getGestaltContext().org;
}

exports.setCurrentOrg = (s) => {
    if (!s) throw Error("Org not specified")
    if (!s.fqon) throw Error("Org fqon not specified")

    const org = {
        id: s.id,
        name: s.name,
        description: s.description,
        fqon: s.fqon
    }

    const context = getGestaltContext();
    Object.assign(context, { org: org }); // merge in context

    delete context.workspace;
    delete context.environment;
    delete context.container;

    gestaltContext.setContext(context);
}

exports.setCurrentEnvironment = (s) => {
    if (!s) throw Error("Environment not specified")
    if (!s.id) throw Error("Environment ID not specified")

    const env = {
        id: s.id,
        name: s.name,
        description: s.description
    }

    const context = getGestaltContext();
    Object.assign(context, { environment: env }); // merge in context

    delete context.container;

    gestaltContext.setContext(context);
}


exports.getCurrentWorkspace = () => {
    return getGestaltContext().workspace;
}

exports.setCurrentWorkspace = (s) => {
    if (!s) throw Error("Workspace not specified")
    if (!s.id) throw Error("Workspace ID not specified")

    const ws = {
        id: s.id,
        name: s.name,
        description: s.description
    }

    const context = getGestaltContext();
    Object.assign(context, { workspace: ws }); // merge in context

    delete context.environment;
    delete context.container;

    gestaltContext.setContext(context);
}

exports.getCurrentEnvironment = () => {
    return getGestaltContext().environment;
}
