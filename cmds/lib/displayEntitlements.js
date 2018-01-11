#!/usr/bin/env node
'use strict';

exports.run = (resources) => {

    const argv = require('yargs').argv
    const columnify = require('columnify');
    const chalk = require('chalk');
    const identities = {};

    // Collect identities into a single ojbect tree
    resources.map(item => {
        item.properties.identities.map(i => {
            identities[i.id] = {
                name: i.name,
                type: i.href.indexOf('/users/') > -1 ? "User" : "Group"
            };
            identities[i.id].actions = []; // initialize
        })
    });

    // console.log(Object.values(identities));


    const entitlements = resources.map(item => {
        let ids = item.properties.identities.map(i => {
            return i.id;
        })
        return {
            action: item.properties.action,
            identities: ids
        }
    })

    // console.log(JSON.stringify(entitlements, null, 2))

    entitlements.map(item => {
        item.identities.map(i => {
            identities[i].actions.push(item.action);
        });
    });

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

    // Display
    Object.values(identities).map(item => {
        console.log(chalk.bold.underline(`${item.name} (${item.type}):`));
        console.log()
        // console.log(item.entitlements);

        const displayObject = [];
        for (let n in nouns) {
            let noun = nouns[n];
            var i = {
                action: noun
            };
            for (let v in verbs) {
                let verb = verbs[v];
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
