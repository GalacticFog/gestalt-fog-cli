'use strict';
const { debug } = require('./debug');
const columnify = require('columnify');
const chalk = require('./chalk');

exports.run = (resources, options) => {

    debug('Resources:');
    debug(resources);

    const identities = {};

    // Collect identities into a single ojbect tree
    for (let item of resources) {
        item.properties.identities.map(i => {
            identities[i.id] = {
                name: i.name,
                type: i.href.indexOf('/users/') > -1 ? "User" : "Group"
            };
            identities[i.id].actions = []; // initialize
        })
    }

    // console.log(Object.values(identities));
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

    //  console.log(JSON.stringify(entitlements, null, 2))
    debug('Entitlements:');
    debug(entitlements);

    for (let item of entitlements) {
        item.identities.map(i => {
            identities[i].actions.push(item.action);
        });
    }

    //
    // Display
    //

    if (options && options.raw) {

        for (let key of Object.getOwnPropertyNames(identities)) {
            identities[key].actions.sort();
        }

        console.log(JSON.stringify(Object.values(identities).sort(), null, 2));

    } else if (options && options.list) {

        for (let item of Object.values(identities).sort()) {

            console.log(chalk.bold.underline(`${item.name} (${item.type})`));
            for (let a of item.actions.sort()) {
                console.log(`  ${a}`);
            }
            console.log();
        }

    } else {

        let nouns = new Set();
        let verbs = new Set();

        // convert action.verb1, action.verb2 to action: [verb1, verb2]
        Object.values(identities).map(i => {
            i.entitlements = [];
            i.actions = i.actions.sort();
            i.actions.map(action => {
                let keyval = action.split('.');

                // Add to nouns and verbs (rows and columns)
                nouns.add(keyval[0]);
                verbs.add(keyval[1]);

                i.entitlements[keyval[0]] = i.entitlements[keyval[0]] || {};
                i.entitlements[keyval[0]][keyval[1]] = true;
            });
            delete i.actions;
        });

        nouns = Array.from(nouns);
        verbs = Array.from(verbs);

        // console.log(Object.values(identities));
        debug('Identities:');
        debug(identities);

        // Default Display

        Object.values(identities).map(item => {
            console.log(chalk.bold.underline(`${item.name} (${item.type}):`));
            console.log()
            // console.log(item.entitlements);

            const displayObject = [];
            for (let noun of nouns) {
                var i = {
                    action: noun
                };
                for (let verb of verbs) {
                    if (item.entitlements[noun] && item.entitlements[noun][verb]) {
                        i[verb] = '[X]';
                    } else {
                        i[verb] = '[ ]';
                    }
                }
                // console.log(i)
                displayObject.push(i);
            }
            const columns = columnify(displayObject, {
                columns: ["action"].concat(Array.from(verbs)),
                minWidth: 6
            });
            console.log(columns);
            console.log();
        });
    }
}
