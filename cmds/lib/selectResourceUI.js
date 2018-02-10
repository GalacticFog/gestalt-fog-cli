'use strict';

exports.run = (options, unsedCallback) => {
    if (!options) throw Error("missing options");
    if (!options.resources) throw Error("missing options.resources");
    if (!options.fields) throw Error("missing options.fields");
    if (!options.mode) throw Error("missing options.mode");
    if (unsedCallback) throw Error('Not using callbacks anymore');

    const inquirer = require('inquirer');
    inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

    const widths = {};

    // NOTE: Main can't seem to be wrapped in a main() function, otherwise 
    // nodejs exits

    // -- Main --

    const context = {}
    let resources = options.resources;

    // if (resources.length == 0) {
    //     console.log("No resources.")
    //     return;
    // }

    if (options.sortBy) {
        resources = sortBy(resources, options.sortBy);
    }

    // Create a new resources array with {value: original resource, display: object suitable for column display }
    const displayItems = resources.map(item => {
        // Polulate required values
        const di = {
            value: item,
            display: {}  // this will become a flat map of keys, e.g. props:{fqon:"asdf"} --> 'props.fqon': 'asdf'
        };
        options.fields.map(f => {
            // convert to flat map
            di.display[f] = eval(`item.${f}`) || "(empty)";
        });
        return di;
    })

    // Calculate the width of each 'column', which is defined by field key
    displayItems.map(di => {
        // find the max length of the field
        options.fields.map(f => {
            if (!widths[f]) widths[f] = 0;
            widths[f] = Math.max(widths[f], String(di.display[f]).length)
        });
    })

    // Transform to array that Inquirer expects
    const choiceList = displayItems.map(di => {
        return {
            name: formatLine(di.display),  // the column-formatted line
            value: di.value                 // the original raw value of the resource
        };
    })

    // if list is empty, offer none
    if (choiceList.length == 0) {
        choiceList.push({
            name: "-- None --",
            value: null
        });
    }

    let prompt = null;

    if (options.mode == 'autocomplete') {

        // inquirer prompt object to select org.  type: autocomplete is handled by the
        // inquirer autocomplete plugin.
        prompt = {
            type: 'autocomplete',
            name: 'value',
            message: options.message,
            source: searchChoices,
            pageSize: options.pageSize || 20,
        };

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
    } else if (options.mode == 'list') {
        prompt = {
            type: 'list',
            name: 'value',
            message: options.message,
            paginated: true,
            pageSize: options.pageSize || 20,
            choices: choiceList
        };
    } else if (options.mode == 'checkbox') {

        if (options.defaultChecked) {
            choiceList.map(item => {
                item.checked = true;
            });
        }

        prompt = {
            type: 'checkbox',
            name: 'value',
            message: options.message,
            paginated: true,
            pageSize: options.pageSize || 20,
            choices: choiceList
        };
    }

    return inquirer.prompt([prompt]).then(result => result.value);

    // Nothing after this step, inquirer gets called asyncronously

    function formatLine(item) {
        let fields = options.fields;
        let sep = '     ';
        let returnString = '';

        // Calculate padding for all except last column
        for (let i in fields) {
            let f = fields[i];
            // use 'eval' because field could be 'properties.image'.  Not a flat map, need to drill down into the object.

            let s = item[f];

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
}

function sortBy(arr, key) {
    return arr.sort((a, b) => {
        if (a[key] < b[key]) { return -1; }
        if (a[key] > b[key]) { return 1; }
        return 0;
    })
}
