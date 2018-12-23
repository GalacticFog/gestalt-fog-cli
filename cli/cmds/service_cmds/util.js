module.exports = {
  generateBasePackURL,
};

function generateBasePackURL(env) {
  if (!env.GF_DEFAULT_OBJECT_STORAGE_ADDRESS) {
    throw new Error('Missing Environment Variable: "GF_DEFAULT_OBJECT_STORAGE_ADDRESS"');
  }

  const port = env.GF_DEFAULT_OBJECT_STORAGE_PORT
    ? `:${env.GF_DEFAULT_OBJECT_STORAGE_PORT}`
    : '';

  return `http://${env.GF_DEFAULT_OBJECT_STORAGE_ADDRESS}${port}`;
}
