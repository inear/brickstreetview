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

    var self = this;
    setTimeout(function() {
      self.pub('loader:hide');
    }, 500);

    ga('send', 'pageview', '/about');

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
    onPreload: function() {

      this.pub('loader:show');

      setTimeout(function() {

        Vue.nextTick(function(){
          this.$emit('load-complete');
          this.$dispatch('init-complete');

        }.bind(this))
      }.bind(this), 500);
    }
  },

  detached: function() {
    console.log('detached');
    //this.pub('backbutton:hide');
  }
};
