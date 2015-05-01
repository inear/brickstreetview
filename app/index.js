'use strict';

var debug = require('debug');

var gmapsUtils = require('./lib/gmaps-utils');
var qs = require('nk-query-string');
var _ = require('lodash');
var detector = require('./lib/detector');
var Vue = require('vue');
var Brickmarks = require('./lib/brickmarks');

Vue.use(require('vue-route'));
Vue.use(require('vue-once'));

if (qs('quality') === 'low') {
  detector.browsers.lowPerformance = function() {
    return true;
  };
}

if (qs('nowebgl')) {
  detector.features.webgl = false;
}

require('./lib/gmaps-utils').configure({
  key: '',
  libraries: ['places', 'geometry']
});

if (process.env.NODE_ENV === 'production') {
  // Disable all debug logs in production.
  debug.disable();
  Vue.config.silent = true;
} else {
  // Enable debug log via query string.
  // Example: ?debug=url,route
  //
  // Here `route` is enabled by default.
  require('enable-debug')(['route'], true);

  Vue.config.debug = true;
}

// Statup the router.
new Vue({
  el: '#app',

  created: function() {
    _.bindAll(this, 'onLoadComplete', 'onInitComplete');
  },

  events: {
    'load-complete': 'onLoadComplete',
    'init-complete': 'onInitComplete'
  },

  mixins: [
    require('vue-mediator-mixin')
  ],

  routes: {
    '/nosupport': {
      componentId: 'section-nosupport',
      isDefault: false,
      beforeUpdate: function(currentCtx, prevCtx, next) {
        next();
      },
      afterUpdate: function(currentCtx, prevCtx) {
        this.pub('routePreload:nosupport');
        this.showFavsBtn = false;
        this.showBackBtn = false;
        this.showPhotoShareBtn = false;
      }
    },

    '/about': {
      componentId: 'section-about',
      isDefault: false,
      beforeUpdate: function(currentCtx, prevCtx, next) {

        //setTimeout(function() {
          next();
        //}, 500);

      },
      afterUpdate: function(currentCtx, prevCtx) {
        this.pub('routePreload:about');
        this.showBackBtn = detector.features.webgl;
        this.showPhotoShareBtn = false;
        this.showFavsBtn = false;

        if (prevCtx.path && prevCtx.path.indexOf('streetview') !== -1) {
          this.backButtonLabel = 'back';
        }
        else {
          this.backButtonLabel = 'map';
        }

      }
    },

    '/map': {
      isDefault: true,
      beforeUpdate: function(){

        if (isFullySupported()) {
          Vue.nextTick(function(){
            Vue.navigate('/map/@' + Brickmarks.getRandomLocationString() + ',17');
          });
        }
        else {
          Vue.navigate('/nosupport');
        }
      }
    },
    '/map/:coords': {
      componentId: 'section-map',

      beforeUpdate: checkGMapsAPI,
      afterUpdate: function() {
        this.pub('routePreload:map');
        this.pub('location:updated');
        this.showBackBtn = false;
        this.showPhotoShareBtn = false;
        this.showFavsBtn = true;
        this.backButtonLabel = 'map';
      }
    },
    '/streetview': streetviewHandler(),
    '/streetview/:panoid': streetviewHandler(),
    options: {

    }
  },

  components: {
    'section-loader': require('./components/loader'),
    'top-menu-component': require('./components/top-menu'),
    'share-ui-component': require('./components/share-ui'),
    'favs-component': require('./components/favs'),
    'back-button-component': require('./components/back-button'),
    'search-bar-component': require('./components/search-bar'),
    'section-nosupport': require('./sections/nosupport'),
    'section-about': require('./sections/about'),
    'section-map': require('./sections/map'),
    'section-streetview': require('./sections/streetview')
  },

  data: function() {
    return {
      showBackBtn: false,
      backButtonLabel: 'map',
      backButtonUrl: '',
      showPhotoShareBtn: false,
      showFavsBtn: false,

    };
  },

  methods: {
    onLoadComplete: function() {

    },

    onInitComplete: function() {

      setTimeout(function() {
        this.pub('loader:hide');
        this.$$.top.classList.add('active');
      }.bind(this), 100);
    },

    onLogoClick: function() {
      Vue.navigate('/map');
    }
  }
});

function streetviewHandler() {
  return {
    componentId: 'section-streetview',

    beforeUpdate: checkGMapsAPI,
    afterUpdate: function() {
      this.pub('routePreload:streetview');
      this.pub('location:updated');
      this.showBackBtn = true;
      this.showPhotoShareBtn = true;
      this.backButtonLabel = 'map';
    }

  };
}


var apiLoaded = false;

function checkGMapsAPI(currentCtx, prevCtx, next) {
  //console.log('beforeUpdate',this);

  this.pub('loader:show');

  if (!isFullySupported()) {
    Vue.navigate('/nosupport');
    return;
  }

  this.backButtonUrl = prevCtx.path;

  //wait for loader animation
  setTimeout(function() {

    if (apiLoaded) {
      next();
    }
    else {

      apiLoaded = true;

      gmapsUtils.load(function() {
        next();
      });
    }
  }, 500);
}

function isBrowserSupported() {
  var isSupported = true;

  if (detector.browsers.ie()
      && detector.browsers.ie() < 10) {
    isSupported = false;
  }

  return isSupported;
}

function isOSSupported() {
  var isSupported = true;

  if (detector.os.android
      && parseFloat(detector.os.getAndroidVersion()) < 4.4) {
    isSupported = false;
  }

  if (detector.os.ios
      && detector.os.getOsVersion() < 8) {
    isSupported = false;
  }

  return isSupported;
}

function isFullySupported() {
  return isBrowserSupported() && isOSSupported() && detector.features.webgl;
}
