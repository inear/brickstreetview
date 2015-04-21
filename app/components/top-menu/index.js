'use strict';

var fs = require('fs');
var _ = require('lodash');
var Vue = require('vue');

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

  data: function() {
    return {
      showSharePhoto: false
    };
  },

  methods: {
    onTakePhoto: function() {
      this.pub('takePhoto');
    },

    onAbout: function() {
      Vue.navigate('/about');
      //this.pub('loader:show', '/about');
    },

    onFavs: function() {
      this.pub('favs:open');
    }
  }
};
