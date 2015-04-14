'use strict';

var fs = require('fs');
var _ = require('lodash');

module.exports = {
  replace: true,
  mixins: [
    require('vue-mediator-mixin')
  ],
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),
  created: function() {

  },

  beforeDestroy: function() {

  },

  methods: {
    onTakePhoto: function() {
      this.pub('takePhoto');
    }
  }
};
