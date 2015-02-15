'use strict';

var fs = require('fs');
var debug = require('debug')('landing');

module.exports = {
  replace: true,
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),

  data: function() {
    return {
      title: 'Landing'
    };
  },

  components: {
    'temp-component': require('../../components/temp')
  },

  attached: function() {
    debug('attached');
  }
};
