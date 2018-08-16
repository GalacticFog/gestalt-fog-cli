const { buildNode } = require('./builders/nodeBuilder');

module.exports = {
  build,
};

function build(type, file) {
  switch (type) {
    case 'nodejs':
      return buildNode(file);;
    default:
      return buildNode(file);
  }
}
