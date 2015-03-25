'use strict';

var fs = require('fs');
var Vue = require('vue');

module.exports = {
  replace: true,
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),
  methods: {
    onClick: function() {
      Vue.navigate('/map');
    }
  }
};
