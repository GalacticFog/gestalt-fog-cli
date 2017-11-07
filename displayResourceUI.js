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
            let s = eval(`item.${f}`);

            if (i == fields.length - 1) {
                returnString += s;
            } else {
                let padding = ' '.repeat(widths[f] - s.length);    
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


    // -- Main --

    let displayResources = sortBy(resources, options.sortField);

    displayResources.map(item => {
        // Polulate required values
        options.fields.map(f => {
            item[f] = item[f] || "";
        });
    })

    displayResources.map(item => {
        // find the max length of the field
        options.fields.map(f => {
            if (!widths[f]) widths[f] = 0;
            widths[f] = Math.max(widths[f], String(item[f]).length)
        });
    })

    // Account for field headers
    for (let i in options.fields) {
        widths[options.fields[i]] = Math.max(widths[options.fields[i]], options.headers[i].length);
    }


    // Display
    console.log();
    console.log(formatHeaders());
    console.log();
    displayResources.map(item => {
        console.log(formatLine(item));
        console.log();
    });
}
