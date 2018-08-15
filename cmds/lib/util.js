const fs = require('fs');
const yaml = require('js-yaml');

module.exports = {
    loadObjectFromFile,
    readFileAsText
}

function loadObjectFromFile(file) {
    if (file.endsWith('.yaml')) {
        return loadYAMLFromFile(file);
    }
    return JSON.parse(this.readFileAsText(file));
}

function loadYAMLFromFile(filePath) {
    if (fs.existsSync(filePath)) {
        try {
            return yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            throw new Error(`Error reading '${filePath}'`);
        }

    }

    throw new Error(`File '${filePath}' not found`);
}

function readFileAsText(file) {
    if (fs.existsSync(file)) {
        const contents = fs.readFileSync(file, 'utf8');
        return contents;
    }
    throw Error(`'${file}' not found`);
}
