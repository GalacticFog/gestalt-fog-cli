const fs = require('fs');

exports.loadObjectFromFile = (file) => {
    return JSON.parse(this.readFileAsText(file));
}

exports.readFileAsText = (file) => {
    if (fs.existsSync(file)) {
        const contents = fs.readFileSync(file, 'utf8');
        return contents;
    }
    throw Error(`'${file}' not found`);
}
