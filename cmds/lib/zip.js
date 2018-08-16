const fs = require('fs');
const archiver = require('archiver');

function zip(path) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path);
    const archive = archiver('zip');

    output.on('close', () => {
      console.log(`Zipped ${archive.pointer()} total bytes`);

      resolve(new Buffer(fs.readFileSync(path), 'binary'));
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.glob('**/*');
    archive.finalize();
  });
}

module.exports = {
  zip,
};
