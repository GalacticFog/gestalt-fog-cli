const { spawn } = require('child_process');

const listeners = spawn => {
  spawn.stdout.on('data', data => console.log(data.toString('utf8')));
  spawn.stderr.on('data', data => console.log(data.toString('utf8')));
};

function fspawn(...args) {
  return new Promise((resolve, reject) => {
    const newSpawn = spawn(...args)

    listeners(newSpawn);
    newSpawn.addListener('error', reject);
    newSpawn.addListener('exit', resolve);
  });
}

module.exports = {
  fspawn,
};

