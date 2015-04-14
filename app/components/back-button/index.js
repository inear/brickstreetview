'use strict';

var fs = require('fs');
var Vue = require('vue');
var _ = require('lodash');

module.exports = {
  replace: true,
  mixins: [
    require('vue-mediator-mixin')
  ],
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),
  created: function(){

  },

  beforeDestroy: function() {

  },

  methods: {
    onClick: function() {
      //this.pub('loader:show');
      Vue.navigate('/map');
    }
  }
};
