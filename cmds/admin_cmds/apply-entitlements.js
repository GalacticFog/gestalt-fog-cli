const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
const util = require('../lib/util');
const gestalt = require('../lib/gestalt');
const chalk = require('../lib/chalk');

exports.command = 'apply-entitlements'
exports.desc = 'Apply entitlements from file'
exports.builder = {
    file: {
        alias: 'f',
        description: 'Entitlements definition file',
    },
    group: {
        description: 'Entitlements definition file',

    },
    path: {
        description: 'Context path to apply entitlements to',
    },
    'dry-run': {
        description: 'Do not actually update entitlements',
    }
}

exports.handler = cmd.handler(async function (argv) {
    if (!argv.file) throw Error('missing --file parameter');
    if (!argv.group) throw Error('missing --group parameter');
    if (!argv.path) throw Error('missing --path parameter');

    const { actions, scope } = util.loadObjectFromFile(argv.file);
    validate(actions);

    const context = await cmd.resolveContextPath(argv.path);
    validateContextScope(context, scope);

    // Query for groups
    const groups = await gestalt.fetchGroups();
    const group = groups.find(g => g.name == argv.group)
    if (!group) throw Error(`Group '${argv.group}' not found`);

    // Query for entitlements
    const entitlements = await gestalt.fetchEntitlements(context);

    // Set up
    const entitlementsToUpdate = [];
    const entitlementsLeftToProcess = actions.sort();

    // Collect results here so we can display (sorted) at the end
    const summary = {};

    // Algorithm:
    // Scan through the list of entitlements on the Org/Workspace/Environment.
    // - If the entitlement is present in the permitted list, the identity should be there (add it if it isn't)
    // - If the entitlement is not present in the permitted list, the identity should not be there (remove it if it is)
    //
    for (let e of entitlements) {
        // Transform identities into a simple array of IDs - this is what a PUT request expects
        e.properties.identities = e.properties.identities.map(i => {
            return i.id;
        })

        const action = e.properties.action;
        const index = entitlementsLeftToProcess.indexOf(action);

        if (index > -1) {
            // Add identity (if doesn't exist)
            if (e.properties.identities.indexOf(group.id) == -1) {
                e.properties.identities.push(group.id);
                entitlementsToUpdate.push(e);

                summary[action] = '+';
            } else {
                summary[action] = ' ';
            }

            // Remove so it is accounted for
            entitlementsLeftToProcess.splice(index, 1);
        } else {
            // remove identity (if exits)
            const index = e.properties.identities.indexOf(group.id);
            if (index > -1) {
                e.properties.identities.splice(index, 1);
                entitlementsToUpdate.push(e);
                // console.log(`Group '${group.name}' exists for entitlement '${e.properties.action}', will remove from entitlement`)
                summary[action] = '-';
            } else {
                // console.log(`Group '${group.name}' doesn't exist for entitlement '${e.properties.action}', won't modify entitlement`)
                summary[action] = ' ';
            }
        }
    }

    // Check for unaccounted for entitlements
    let errors = 0;
    for (let a of entitlementsLeftToProcess) {
        console.error(`Error: Entitlement '${a}' not found in entitlements`);
        errors++;
    }

    if (errors) {
        throw Error(`Aborting due to ${errors} errors`)
    }

    // Show summary of actions
    for (let key of Object.keys(summary).sort()) {
        if (summary[key] != ' ') {
            console.error(`${summary[key]} ${key}`);
        } else {
            // console.error(chalk.dim("  " + key))
            debug(`${summary[key]} "${key}",`);
        }
    }

    console.log(`Will make ${entitlementsToUpdate.length} changes.`)

    // Apply actions
    if (argv['dry-run']) {
        console.error(`Skipping update due to dry run`);
    } else {
        for (let e of entitlementsToUpdate) {
            console.log('Updating entitlement ' + e.properties.action);
            const resp = await gestalt.updateEntitlement(context, e);
        }
    }

    console.log('Done.');
});

function validate(entitlements) {

    // Copy
    entitlements = entitlements.slice().sort();

    // Vaidate that there aren't duplicates
    for (let i = 0; i < entitlements.length - 1; i++) {
        if (entitlements[i + 1] == entitlements[i]) {
            throw Error(`Found duplicate entitlement: ${entitlements[i]}`);
        }
    }
}


function validateContextScope(context, scope) {
    if (!scope) {
        // throw Error('Missing scope');
    } else if (scope == "org") {
        if (context.workspace || context.environment) {
            throw Error('Policy applies to org scope');
        }
    } else if (scope == "workspace") {
        if (context.environment) {
            throw Error('Policy applies to workspace scope');
        }
    } else if (scope == "environment") {

    }
}
