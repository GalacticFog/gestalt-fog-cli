'use strict';

//TODO: Move to /lib dir and rename to selectResourceUI
exports.run = (options, callback) => {

    const _ = require('lodash');
    const inquirer = require('inquirer');
    inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

    const widths = {};

    function formatLine(item) {
        let fields = options.fields;
        let sep = '     ';
        let returnString = '';

        // Calculate padding for all except last column
        for (let i in fields) {
            let f = fields[i];
            // use 'eval' because field could be 'properties.image'.  Not a flat map, need to drill down into the object.

            let s = eval(`item.${f}`);
            
            // Could be a number, convert to string, otherwise  += doesn't append and column widths would be off
            s = String(s);

            if (i == fields.length - 1) {
                returnString += s;
            } else {
                const repeat = widths[f] - s.length;
                if (repeat < 0) {
                    console.error("Warning: repeat:" + repeat);
                    console.error(`f: ${f}, widths[f]: ${widths[f]}`)
                }
                const padding = ' '.repeat(repeat > 0 ? repeat : 0);    
                returnString += s + padding + sep;            
            }
        }

        return "  " + returnString; // indent some with appended spaces
    }



    // NOTE: Main can't seem to be wrapped in a main() function, otherwise 
    // nodejs exits

    // -- Main --
    const state = {}
    const resources = options.fetchFunction();

    resources.map(item => {
        // Polulate required values
        options.fields.map(f => {
            item[f] = item[f] || "(empty)";
        });
    })

    resources.map(item => {
        // find the max length of the field
        options.fields.map(f => {
            if (!widths[f]) widths[f] = 0;
            widths[f] = Math.max(widths[f], String(eval(`item.${f}`)).length)
        });
    })

    // Transform to array that Inquirer expects
    const choiceList = resources.map(item => {
        let name = formatLine(item);
        return {
            name: name,
            value: item[options.valueKey],
            // short: item.name
        };
    })

    // if list is empty, offer none
    if (choiceList.length == 0) {
        choiceList.push({
            name: "-- None --",
            value: {}
        });
    }

    let prompt = null;

    if (this.mode == 'autocomplete') {

        // inquirer prompt object to select org.  type: autocomplete is handled by the
        // inquirer autocomplete plugin.
        prompt = {
            type: 'autocomplete',
            name: options.returnValue,
            message: options.message,
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
            message: options.message,
            paginated: true,
            pageSize: 50,
            choices: choiceList
        };
    }

    inquirer
        .prompt([prompt])
        .then(callback) // callback with response

    // Nothing after this step, inquirer gets called asyncronously
}
