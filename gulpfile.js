'use strict';

var path = require('path');

require('fs')
  .readdirSync('./gulp/tasks/')
  .forEach(function(task) {
    if (path.extname(task) !== '.js') return;
    require('./gulp/tasks/' + task);
  });
