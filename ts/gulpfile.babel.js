var gulp = require('gulp');
var path = require('path');
var gutil = require("gulp-util");
var webpack = require("webpack");
var sass = require('gulp-sass');

gulp.task('default', ['sass'], function(done) {
  webpack(webpackConfig, function(err, stats) {
    if (err) {
      throw new gutil.PluginError('webpack', err);
    }
    gutil.log('[default]', stats.toString());
    done();
  });
});

gulp.task('sass', function() {
  gulp.src('*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('../web'));
});

gulp.task('watch', ['webpack'], function() {
  gulp.watch([
    '**/*.ts'
  ], {}, ['webpack']);

  gulp.watch(['**/*.scss'], {}, ['sass']);
});

var webpackConfig = {
  context: path.resolve('.'),
  entry: 'eden.ts',
  output: {
    path: '../web',
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
    new webpack.optimize.UglifyJsPlugin({}) // For now, remove this to get non-ugly output. TODO(jgw): Make this configurable.
  ]
};
