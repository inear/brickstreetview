'use strict';

require('gsap');

var fs = require('fs');
var Vue = require('vue');
var debug = require('debug')('landing');
var _ = require('lodash');

module.exports = {
  replace: true,
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),

  created: function() {
    _.bindAll(this, 'startProcessing');

    this.startProcessing();
  },

  ready: function() {

  },
  /*
  transitions: {
    landing: {
      leave: function(el, done) {
        var loadingBar = el.querySelector('.Landing-loadingBar');
        var avatar = el.querySelector('.Landing-avatar');

        var tl = new TimelineMax({
          paused: true,
          onComplete: done
        });

        tl.to(loadingBar, 0.3, {
          opacity: 0,
          y: -300
        });

        tl.to(avatar, 0.3, {
          opacity: 0,
          y: 300
        }, 0.1);

        tl.restart();

        return function() {
          tl.pause();
        };
      }
    }
  },
*/
  data: function() {
    return {
      title: 'Landing'
    };
  },

  components: {

  },

  methods: {
    startProcessing: function() {
      var self = this;
      console.log('handle loading here');

      setTimeout(function() {
        Vue.navigate('/map');
      }, 2000);
    }
  },

  attached: function() {
    debug('attached');
  }
};
