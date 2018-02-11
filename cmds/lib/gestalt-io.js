// const os = require('os');
const fs = require('fs');

exports.exportResourceToFile = (obj, file) => {
    if (fs.existsSync(file)) {
        throw Error(`File '${file}' exists`);
    }

    const contents = `${JSON.stringify(obj, null, 2)}\n`;
    fs.writeFileSync(file, contents);
}

exports.loadResourceFromFile = (file) => {
    if (fs.existsSync(file)) {
        const contents = fs.readFileSync(file, 'utf8');
        return JSON.parse(contents);
    }
    throw Error(`'${file}' not found`);
}

