'use strict';

//TODO: Move to /lib dir and rename to selectResourceUI
exports.run = (options, resources) => {

    const chalk = require('chalk');

    const widths = {};

    function sortBy(arr, key) {
        return arr.sort((a, b) => {
            if (a[key] < b[key]) { return -1; }
            if (a[key] > b[key]) { return 1; }
            return 0;
        })
    }

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

    function formatHeaders() {
        let fields = options.fields;
        let headers = options.headers;

        let sep = '     ';
        let arr = [];

        // Add spaces to the headers to match the max width of the column (not including separaters)
        for (let i in fields) {
            let f = fields[i];
            arr[i] = headers[i] + ' '.repeat(widths[f] - headers[i].length);
            arr[i] = chalk.underline(arr[i]);
        }
        return "  " + arr.join(sep);
    }

    function buildOutObject(obj, field) {
        // field can be nested, e.g. 'properties.workspace.name'
        // Make sure that obj.properties, obj.properties.workspace exist
        let f = field.split('.');
        for (let i in f) {
            let newField = f.slice(0, i).join('.');
            console.log(String(i) + ", new Field " + newField)
            if (i > 0 && i < f.length) {
                eval(`obj.${newField} = obj.${newField} || {}`);
            }
        }
    }



    // -- Main --

    let displayResources = sortBy(resources, options.sortField);

    displayResources.map(item => {
        // Polulate required values
        options.fields.map(f => {

            buildOutObject(item, f);

            item[f] = eval(`item.${f}`) || "(empty)";
        });
    })

    displayResources.map(item => {
        // find the max length of the field
        options.fields.map(f => {
            if (!widths[f]) widths[f] = 0;
            widths[f] = Math.max(widths[f], String(eval(`item.${f}`)).length);
        });
    })

    // Account for field headers
    for (let i in options.fields) {
        widths[options.fields[i]] = Math.max(widths[options.fields[i]], options.headers[i].length);
    }


    // Display
    console.log();
    console.log(formatHeaders());
    // console.log();
    displayResources.map(item => {
        console.log(formatLine(item));
        // console.log();
    });
}
