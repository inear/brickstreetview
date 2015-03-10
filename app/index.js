'use strict';

var debug = require('debug');

var gmapsUtils = require('./lib/gmaps-utils');

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
  routes: {
    '/map': {
      componentId: 'section-map',
      isDefault: true,
      beforeUpdate:checkGMapsAPI
    },
    '/streetview': {
      componentId: 'section-streetview',
      isDefault: false,
      beforeUpdate:checkGMapsAPI
    },
    '/streetview/:panoid': {
      componentId: 'section-streetview',
      isDefault: false,
      beforeUpdate:checkGMapsAPI
    },
    options: {
        base: '/'
    }
  },

  components: {
    'section-map': require('./sections/map'),
    'section-streetview': require('./sections/streetview')
  }
});

var apiLoaded = false;

function checkGMapsAPI(currentCtx, prevCtx, next){

  if( apiLoaded ) {
    next();
  }
  else {

    apiLoaded = true;

    gmapsUtils.load(function(){
      next();
    });
  }
}

