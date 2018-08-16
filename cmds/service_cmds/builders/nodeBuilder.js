
const { fspawn } = require('../../lib/spawn');
const fs = require('fs');
const { zip } = require('../../lib/zip');

module.exports = {
  buildNode,
};

async function buildNode(file) {
  // Make sure it's a node project
  if (fs.existsSync('./package.json')) {
    await fspawn('rm', ['-fr', 'node_modules', '.build_service']);
    await fspawn('npm', ['install']);
  }

  await fspawn('mkdir', ['.build_service']);
  return await zip(`.build_service/${file}`);
}
