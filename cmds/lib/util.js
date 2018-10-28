const fs = require('fs');
const yaml = require('js-yaml');

module.exports = {
  loadObjectFromFile,
  readFileAsText,
  cloneObject,
  getFileObjectType,
  loadObjectFromString
};

function getFileObjectType(file) {
  if (file.endsWith('.yaml') || file.endsWith('.yml')) {
    return 'yaml';
  }
  if (file.endsWith('.json')) {
    return 'json'
  }
  return undefined;
}

function loadObjectFromString(str, type) {
  if (type == 'yaml') return yaml.safeLoad(str);
  return JSON.parse(str);
}

function loadObjectFromFile(file) {
  if (file.endsWith('.yaml') || file.endsWith('.yml')) {
    return loadYAMLFromFile(file);
  }

  return JSON.parse(readFileAsText(file));
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

function cloneObject(o) {
  if (o === undefined) return undefined;
  if (typeof o === 'undefined') return undefined; // just in case
  return JSON.parse(JSON.stringify(o));
}
