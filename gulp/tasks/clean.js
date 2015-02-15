'use strict';

var rm = require('rimraf');
var output = require('../config').output.path;

require('gulp').task('clean', function(cb) {
  rm.sync(output);
  cb();
});
