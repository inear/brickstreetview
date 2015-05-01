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
      label: '',
      url: ''
    }
  },

  methods: {
    onClick: function() {

      if (this.url !== null) {
        window.history.back();
      } /*else if (this.url !== '') {
        Vue.navigate(this.url);
      }*/
      else {
        Vue.navigate('/map');
      }
    }
  }
};
