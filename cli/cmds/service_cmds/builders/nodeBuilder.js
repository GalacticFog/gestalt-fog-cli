
const { fspawn } = require('../../lib/spawn');
const fs = require('fs');

module.exports = {
  buildNode,
};

async function buildNode() {
  // Make sure it's a node project
  if (fs.existsSync('./package.json')) {
    await fspawn('npm', ['install']);
  }
}
