const { buildNode } = require('./builders/nodeBuilder');

module.exports = {
  build,
};

function build(type, args) {
  switch (type) {
  case 'nodejs':
    return buildNode(args);
  default:
    return buildNode(args);
  }
}
