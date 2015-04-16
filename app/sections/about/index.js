'use strict';

require('gsap');

var fs = require('fs');
var Vue = require('vue');
var _ = require('lodash');


module.exports = {
  replace: true,
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),

  mixins: [
    require('vue-mediator-mixin')
  ],

  created: function() {
    _.bindAll(this, 'onPreload');

    this.sub('routePreload:about', this.onPreload);
  },

  attached: function() {
    Vue.nextTick(function(){
      this.pub('loader:hide');
    }.bind(this));
  },

  ready: function() {



  },

  data: function() {
    return {

    };
  },

  components: {

  },

  methods: {
    onPreload: function(){
      this.$emit('load-complete');
    }
  },

  detached: function(){
    console.log('detached')
    //this.pub('backbutton:hide');
  }
};
