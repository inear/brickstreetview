'use strict';

var fs = require('fs');

module.exports = {
  replace: true,
  template: fs.readFileSync(__dirname + '/template.html', 'utf8')
};
