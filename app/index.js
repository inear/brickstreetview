'use strict';

var debug = require('debug');

var gmapsUtils = require('./lib/gmaps-utils');
var _ = require('lodash');

var Vue = require('vue');
Vue.use(require('vue-route'));
Vue.use(require('vue-once'));

require('./lib/gmaps-utils').configure({
  key: '',
  libraries: []
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
    '/map': {
      componentId: 'section-map',
      isDefault: true,
      beforeUpdate: checkGMapsAPI,
      afterUpdate: function() {
        this.pub('routePreload:map');
      }
    },
    '/streetview': {
      componentId: 'section-streetview',
      isDefault: false,
      beforeUpdate: checkGMapsAPI,
      afterUpdate: function() {
        this.pub('routePreload:streetview');
      }
    },
    '/streetview/:panoid': {
      componentId: 'section-streetview',
      isDefault: false,
      beforeUpdate: checkGMapsAPI,
      afterUpdate: function() {
        this.pub('routePreload:streetview');
      }
    },
    options: {

    }
  },

  components: {
    'section-loader': require('./components/loader'),
    'back-button-component': require('./components/back-button'),
    'section-map': require('./sections/map'),
    'section-streetview': require('./sections/streetview')
  },

  data: function(){
    return {
      showBackBtn:false
    };
  },

  methods: {
    onLoadComplete: function(){

    },

    onInitComplete: function() {
      this.pub('loader:hide');
    }
  }
});

var apiLoaded = false;

function checkGMapsAPI(currentCtx, prevCtx, next) {
  //console.log('beforeUpdate',this);

  //this.pub('loader:show');

  if( currentCtx.componentId === 'section-streetview') {
    this.showBackBtn = true;
  }
  else {
    this.showBackBtn = false;
  }


  setTimeout( function(){
    if (apiLoaded) {
      next();
    }
    else {

      apiLoaded = true;

      gmapsUtils.load(function() {
        next();
      });
    }
  },200);

}


