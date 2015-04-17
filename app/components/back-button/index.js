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

  data: function(){
    return {
      label: ''
    }
  },

  methods: {
    onClick: function() {
      console.log( 'label', this.label);

      if (this.label === 'back') {
        window.history.back();
      } else {
        Vue.navigate('/map');
      }
      //this.pub('loader:show', '/map');
    }
  }
};
