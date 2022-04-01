const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const Html = require('html-webpack-plugin');
const MiniCssExtract = require('mini-css-extract-plugin');
const Brotli = require('brotli-webpack-plugin');
const Dotenv = require('dotenv-webpack');

const base = {
  context: path.resolve('src'),
  entry: [
    'bootstrap/dist/css/bootstrap.min.css',
    'core-js',
    './index.jsx',
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    fallback: {
      timers: require.resolve('timers-browserify'),
      https: require.resolve('https-browserify'),
      http: require.resolve('stream-http'),
      stream: require.resolve('stream-browserify'),
    },
  },
  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: { sourceMap: true },
        }],
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtract.loader,
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|svg)$/,
        use: 'file-loader',
      },
      {
        test: /\.graphql$/,
        loader: 'webpack-graphql-loader',
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new Html({
      template: path.resolve('./src/template.html'),
      inject: 'head',
    }),
    new MiniCssExtract(),
    new Dotenv(),
  ],
};

const environments = {
  development: {
    mode: 'development',
    output: {
      publicPath: '/',
    },
    watchOptions: {
      ignored: ['node_modules/**'],
    },
    devtool: 'source-map',
    devServer: {
      https: true,
      compress: false,
      port: 8080,
      historyApiFallback: true,
    },
  },

  production: {
    output: {
      path: path.resolve('dist'),
      filename: 'main.[contenthash].js',
      publicPath: '/',
    },
    plugins: [
      new Brotli(),
    ],
  },
};

module.exports = function webpackConfig() {
  const nodeEnv = process.env.NODE_ENV === 'test' ? 'development' : process.env.NODE_ENV;
  return merge(base, environments[nodeEnv] || environments.production);
};
