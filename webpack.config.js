const webpack = require("webpack");
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

var tsDir = path.resolve(__dirname, 'ts');
var webDir = path.resolve(__dirname, 'web');

module.exports = {
  entry: './ts/eden.ts',
  mode: 'development',
  devtool: 'inline-source-map',

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },

  output: {
    filename: 'eden.js',
    path: webDir
  },

  module: {
    rules: [
      {
        include: [tsDir],
        test: /\.tsx?$/,
        use: 'ts-loader',
      }
    ]
  },

  devServer: {
    contentBase: webDir,
  },

  plugins: [
    new webpack.IgnorePlugin(/(fs)/),
    // new webpack.optimize.UglifyJsPlugin({}),
    // new CopyPlugin({patterns:[
    //   { from: 'src', to: webDir },
    // ]})
  ],
};

