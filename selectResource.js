#!/usr/bin/env node
'use strict';

const _ = require('lodash');
const inquirer = require('inquirer');
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const gestalt = require('./gestalt')

const options = {}

// Switch on what resource
if (process.argv.length > 2) {
    if (process.argv[2] === 'ws') {
        options.valueKey = 'id';
        options.columnKey = 'fqon'; // last column
        options.returnValue = "workspace.id";
        options.fetchFunction = () => {
            return gestalt.fetchWorkspaces(gestalt.fetchOrgFqons());
        }
    } else if (process.argv[2] === 'org') {
        options.valueKey = 'fqon';
        options.columnKey = 'fqon'; // last column
        options.returnValue = "org.fqon";
        options.fetchFunction = () => {
            return gestalt.fetchOrgs();
        }
    } else if (process.argv[2] === 'env') {
        options.valueKey = 'id';
        options.columnKey = 'fqon'; // last column
        options.returnValue = "environment.id";
        options.fetchFunction = () => {
            return gestalt.fetchEnvironments();
        }
    } 
}

// write selection to 'state' object
function processSelection(answers) {
    gestalt.persistState(answers);
}

function formatLine(a, b, c) {
    let padding1 = ' '.repeat(widths[0] - String(a).length);
    let padding2 = ' '.repeat(widths[1] - String(b).length);
    let sep = '    ';
    return `${a}${padding1}${sep}${b}${padding2}${sep}${c}`
}

// NOTE: Main can't seem to be wrapped in a main() function, otherwise 
// nodejs exits

// -- Main --
console.log(process.argv)
const state = {}
const resources = options.fetchFunction();

resources.map(item => {
    // Polulate required values
    item.name = item.name || "(null)";
    item.description = item.description || "(null)";
})

let widths = [0, 0];
resources.map(item => {
    // find the max length of the field
    widths[0] = Math.max(widths[0], String(item.description).length);
    widths[1] = Math.max(widths[1], String(item.name).length);
})

// Transform to array that Inquirer expects
const choiceList = resources.map(item => {
    let name = formatLine(item.description, item.name, item[options.columnKey])
    return {
        name: name,
        value: item[options.valueKey],
        short: item.name
    };
})

let prompt = null;

if (process.argv.length > 3 && process.argv[3] === 'autocomplete') {

    let message = formatLine('Description', 'Name', 'Org');

    // inquirer prompt object to select org.  type: autocomplete is handled by the
    // inquirer autocomplete plugin.
    prompt = {
        type: 'autocomplete',
        name: options.returnValue,
        message: `Select \n \n  ${message}\n `,
        source: searchChoices,
        pageSize: 50, // doesn't seem to do anything
    };

    // Search the global 'orgs' object.  Used by the prompt to search the list of orgs
    // returned by gestalt
    function searchChoices(answers, input) {
        input = input || '';
        return new Promise(
            function (resolve) {

                let result = choiceList.filter(choice => {
                    try {
                        return choice.name.toLowerCase().indexOf(input.toLowerCase()) > -1;
                    } catch (e) {
                        return true;
                    }
                })
                resolve(result);
            });
    }
} else {
    prompt = {
        type: 'list',
        name: options.returnValue,
        message: 'Select Workspace:\n',
        paginated: true,
        pageSize: 50,
        choices: choiceList
    };
}

inquirer
    .prompt([prompt])
    .then(processSelection)

    // Nothing after this step, inquirer gets called asyncronously
