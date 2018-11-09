const gestalt = require('../lib/gestalt');
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const { debug } = require('../lib/debug');
exports.command = 'policy-rules [context_path]'
exports.desc = 'List policy rules'
exports.builder = {
    output: {
        alias: 'o',
        description: 'json, raw, yaml, list'
    },
    raw: {
        description: 'Show in raw JSON format'
    }
}
exports.handler = cmd.handler(async function (argv) {

    const policyName = argv.policy;

    debug('Policy name: ' + policyName)

    const context = argv.context_path ? await cmd.resolveContextPath(argv.context_path) : gestaltContext.getContext();

    if (context.environment) {
        doShowEnvironmentPolicyRules(context, argv, policyName);
    } else if (context.workspace) {
        doShowWorkspacePolicyRules(context, argv);
    } else if (context.org) {
        doShowOrgPolicyRules(context, argv);
    } else {
        doShowAllPolicyRules(argv);
    }
});

async function doShowAllPolicyRules(argv) {
    const fqons = await gestalt.fetchOrgFqons();
    for (let fqon of fqons) {
        doShowOrgPolicyRules({ org: { fqon: fqon } }, argv);
    }
}

async function doShowOrgPolicyRules(context, argv) {
    const workspaces = await gestalt.fetchOrgWorkspaces([context.org.fqon]);
    for (let ws of workspaces) {

        const wsContext = {
            ...context,
            workspace: {
                id: ws.id,
                name: ws.name
            }
        }

        doShowWorkspacePolicyRules(wsContext, argv);
    }
}

async function doShowWorkspacePolicyRules(context, argv) {
    const environments = await gestalt.fetchWorkspaceEnvironments(context);
    for (let e of environments) {
        const envContext = {
            ...context,
            environment: {
                id: e.id,
                name: e.name
            }
        };

        doShowEnvironmentPolicyRules(envContext, argv);
    }
}

async function doShowEnvironmentPolicyRules(context, argv, policyName) {
    if (policyName) {
        const rules = await gestalt.fetchPolicyRules({ name: policyName }, context);
        ui.displayResources(rules, argv, context);
    } else {

        const policies = await gestalt.fetchEnvironmentResources('policies', context);
        for (let policy of policies) {
            const rules = await gestalt.fetchPolicyRules({ name: policy.name }, context);
            ui.displayResources(rules, argv, context);
        }
    }
}
