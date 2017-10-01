var gulp = require('gulp');
var path = require('path');
var gutil = require("gulp-util");
var webpack = require("webpack");
var sass = require('gulp-sass');
var WebpackDevServer = require("webpack-dev-server");

gulp.task('default', function(done) {
  webpack(webpackConfig, function(err, stats) {
    if (err) {
      throw new gutil.PluginError('webpack', err);
    }
    gutil.log('[default]', stats.toString());
    done();
  });
});

gulp.task("webpack-dev", function(callback) {
  var compiler = webpack(webpackConfig);
  new WebpackDevServer(compiler, {
    // server and middleware options
  }).listen(8080, "localhost", function(err) {
    if(err) throw new gutil.PluginError("webpack-dev", err);
    gutil.log("[webpack-dev]", "http://localhost:8080/webpack-dev-server/index.html");
    // callback();
  });
});

var webpackConfig = {
  context: path.resolve('.'),
  entry: 'ts/main.ts',
  output: {
    path: path.resolve('./web'),
    publicPath: '/',
    filename: 'eden.js'
  },
  resolve: {
    root: [path.resolve('.')],
    extensions: ['', '.js', '.jsx', '.ts', '.tsx'] // For CommonJS syntax will attempt to resolve all these extensions for require statements.
  },
  module: {
    loaders: [
      {test: /\.tsx?$/, loader: 'ts-loader'} // All files with a `.ts` or `.tsx` extension will be handled by `ts-loader`.
    ]
  },
  plugins: [
    // For now, remove this to get non-ugly output. TODO: Make this configurable.
    // new webpack.optimize.UglifyJsPlugin({})
  ]
};

