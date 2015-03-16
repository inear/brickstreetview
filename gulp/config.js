'use strict';

var join = require('path').join;
var outputRoot = join(process.cwd(), 'static');

module.exports = {
  // Used by autoprefixer.
  browsersSupport: ['last 2 versions', '> 5%'],

  ldraw: {
    path: './static/parts/ldraw/'
  },

  models: {
    path: './static/models/'
  },

  entry: {
    scripts: ['./app/index.js'],
    styles: ['./app/main.styl']
  },

  output: {
    root: outputRoot,
    path: join(outputRoot, 'build'),
    filename: 'app'
  }
};
