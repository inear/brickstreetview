'use strict';

require('gsap');

var fs = require('fs');
var debug = require('debug')('map');
var _ = require('lodash');

module.exports = {
  replace: true,

  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),

  mixins: [
    require('vue-mediator-mixin')
  ],

  created: function() {
    //this.$emit('init-complete');

  },

  compiled: function() {

  },

  ready: function() {

  },

  attached: function() {

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
      title: 'Map',
      uiVisible: true
    };
  },

  components: {
    'custom-gmap-component': require('../../components/custom-gmap')
  },

  methods: {
    onFindLocation: function() {
      this.pub('controls:findLocation');
    },
    onZoomIn: function() {
      this.pub('controls:zoomIn');
    },
    onZoomOut: function() {
      this.pub('controls:zoomOut');
    }
  }
};
