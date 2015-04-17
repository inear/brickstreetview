'use strict';

var fs = require('fs');
var _ = require('lodash');
var TweenMax = require('tweenmax');
var Vue = require('vue');

module.exports = {
  replace: true,
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),
  mixins: [
    require('vue-mediator-mixin')
  ],

  created: function() {
    _.bindAll(
      this,
      'onLoaderShow',
      'onLoaderHide',
      'onResize'
    );

    this.sub('loader:show', this.onLoaderShow);
    this.sub('loader:hide', this.onLoaderHide);
  },

  ready: function() {
    this.showTime = 0;

  },

  attached: function() {
    //Vue.nextTick(function(){
      window.addEventListener('resize', this.onResize);
      this.onResize();
    //}, this);
  },

  data: function() {
    return {
      show: true
    };
  },

  beforeDestroy: function() {
    window.removeEventListener('resize', this.onResize);
  },

  methods: {
    onResize: function() {
      if (this.$$.loaderLabelTiles) {
        TweenMax.set(this.$$.loaderLabelTiles, {x: Math.round(window.innerWidth * 0.5 / 22) * 22 - 66 - 4});
      }
    },

    onLoaderShow: function(route) {
      this.show = true;
      this.showTime = Date.now();

      if (route) {
        setTimeout(function() {
          Vue.navigate(route);
        }, 500);
      }

      //Vue.nextTick(function(){
        this.onResize();
      //}, this);

    },

    onLoaderHide: function() {

      if (Date.now() - this.showTime < 1000) {
        var self = this;
        setTimeout(function() {
          self.show = false;
        }, 500);
      }
      else {
        this.show = false;
      }

    }
  }
};
