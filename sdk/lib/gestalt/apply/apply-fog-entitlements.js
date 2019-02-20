const {
    addUserToGroup,
    removeUserFromGroup,
    createGroup,
    fetchGroups
} = require('../group');

const {
    fetchUsers
} = require('../user');

const {
    fetchEntitlements,
    updateEntitlement
} = require('../entitlements');

const { debug } = require('../../debug');
const chalk = require('../../chalk');

module.exports = {
    applyFogEntitlements,
}

async function applyFogEntitlements(spec, context) {
    debug(`applyFogEntitlements(${spec.name})`)
    debug(chalk.yellow(JSON.stringify(spec, null, 2)));
    const optionAddOnly = true;
    const optionIgnoreErrors = true;

    validate(spec.actions);

    // Query for identity
    let identity = null;
    if (spec.resource_type == 'Fog::Entitlements::Group') {
        const groups = await fetchGroups();
        const group = groups.find(g => g.name == spec.name)
        if (!group) throw Error(`Group '${spec.name}' not found`);
        identity = group;
    } else if (spec.resource_type == 'Fog::Entitlements::User') {
        const users = await fetchUsers();
        const user = users.find(u => u.name == spec.name)
        if (!user) throw Error(`User '${spec.name}' not found`);
        identity = user;
    }
    if (!identity) throw Error(`Identity not found`);

    // Query for entitlements
    const entitlements = await fetchEntitlements(context);

    // Set up
    const entitlementsToUpdate = [];
    const entitlementsLeftToProcess = spec.actions.sort();

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
            if (e.properties.identities.indexOf(identity.id) == -1) {
                e.properties.identities.push(identity.id);
                entitlementsToUpdate.push({
                    entitlement: e,
                    message: `add`
                });

                summary[action] = '+';
            } else {
                summary[action] = ' ';
            }

            // Remove so it is accounted for
            entitlementsLeftToProcess.splice(index, 1);
        } else {
            // remove identity (if exits)
            const index = e.properties.identities.indexOf(identity.id);
            if (index > -1) {
                if (optionAddOnly) {
                    console.error(chalk.yellow(`Will skip remove of '${action}' from '${identity.name}'`));
                    summary[action] = ' ';
                } else {
                    e.properties.identities.splice(index, 1);
                    entitlementsToUpdate.push({
                        entitlement: e,
                        message: `remove`
                    });
                    // console.log(`Identity '${identity.name}' exists for entitlement '${e.properties.action}', will remove from entitlement`)
                    summary[action] = '-';
                }
            } else {
                // console.log(`Identity '${identity.name}' doesn't exist for entitlement '${e.properties.action}', won't modify entitlement`)
                summary[action] = ' ';
            }
        }
    }

    // Check for unaccounted for entitlements
    let errors = 0;
    for (let a of entitlementsLeftToProcess) {
        console.error(chalk.yellow(`Warning: Entitlement action '${a}' not found`));
        errors++;
    }

    if (errors && !optionIgnoreErrors) {
        throw Error(`Aborting due to ${errors} errors`)
    }

    // Show summary of actions
    for (let key of Object.keys(summary).sort()) {
        if (summary[key] != ' ') {
            console.error(chalk.blue(`${summary[key]} ${key}`));
        } else {
            // console.error(chalk.dim("  " + key))
            debug(`${summary[key]} "${key}",`);
        }
    }

    // console.log(`Will make ${entitlementsToUpdate.length} changes.`)

    if (entitlementsToUpdate.length > 0) {

        // Apply actions
        for (let { entitlement, message } of entitlementsToUpdate) {
            console.log(`${entitlement.properties.action}: ${message} '${identity.name}'`);
            const resp = await updateEntitlement(context, entitlement);
            debug(resp);
        }

        return {
            status: `updated`,
            message: `${spec.resource_type} '${spec.name}' updated (${entitlementsToUpdate.length} changes).`,
            resource: spec
        };
    }
    return {
        status: `unchanged`,
        message: `${spec.resource_type} '${spec.name}' unchanged.`,
        resource: spec
    };
}

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
