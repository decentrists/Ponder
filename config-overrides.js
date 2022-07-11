// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require('webpack');

module.exports = function override(config) {
  const loaders = config.resolve;
  loaders.fallback = {
    path: require.resolve('path-browserify'),
    zlib: require.resolve('browserify-zlib'),
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('crypto-browserify'),
    assert: require.resolve('assert'),
    // buffer: require.resolve('buffer/'),
  };
  // eslint-disable-next-line no-param-reassign
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);

  return config;
};
