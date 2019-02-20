'use strict';
const { gestalt } = require('gestalt-fog-sdk')
const debug = require('../lib/debug').debug;

module.exports = {
    getEntitlementsByIdentities,
}

async function getEntitlementsByIdentities(context) {

    const resources = await gestalt.fetchEntitlements(context);

    debug('Resources:');
    debug(resources);

    const identities = {};

    // Collect identities into a single ojbect tree
    for (let item of resources) {
        item.properties.identities.map(i => {
            identities[i.id] = {
                resource_type: i.href.indexOf('/users/') > -1 ? 'Fog::Entitlements::User' : 'Fog::Entitlements::Group',
                name: i.name,
            };
            identities[i.id].actions = []; // initialize
        })
    }

    debug('Identities:');
    debug(identities);

    const entitlements = resources.map(item => {
        let ids = item.properties.identities.map(i => {
            return i.id;
        })
        return {
            action: item.properties.action,
            identities: ids
        }
    })

    debug('Entitlements:');
    debug(entitlements);

    for (let item of entitlements) {
        item.identities.map(i => {
            identities[i].actions.push(item.action);
        });
    }

    for (let key of Object.getOwnPropertyNames(identities)) {
        identities[key].actions.sort();
    }

    const result = Object.values(identities).sort();

    return result;
}
