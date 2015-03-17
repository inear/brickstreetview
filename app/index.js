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

  created: function(){
    _.bindAll(this,'onLoadComplete');
  },

  events: {
    'load-complete': 'onLoadComplete'
  },

  mixins: [
    require('vue-mediator-mixin')
  ],

  routes: {
    '/map': {
      componentId: 'section-map',
      isDefault: true,
      beforeUpdate:checkGMapsAPI,
      afterUpdate: function( currentCtx){
        this.pub('routePreload:map' );
      }
    },
    '/streetview': {
      componentId: 'section-streetview',
      isDefault: false,
      beforeUpdate:checkGMapsAPI,
      afterUpdate: function( currentCtx){
        this.pub('routePreload:streetview' );
      }
    },
    '/streetview/:panoid': {
      componentId: 'section-streetview',
      isDefault: false,
      beforeUpdate:checkGMapsAPI,
      afterUpdate: function(){
        this.pub('routePreload:streetview' );
      }
    },
    options: {
        base: '/'
    }
  },

  components: {
    'section-loader': require('./components/loader'),
    'section-map': require('./sections/map'),
    'section-streetview': require('./sections/streetview')
  },

  methods: {
    onLoadComplete: function(){
      console.log('HIDE')
      this.pub('loader:hide');
    }
  }
});

var apiLoaded = false;

function checkGMapsAPI(currentCtx, prevCtx, next){
  //console.log('beforeUpdate',this);

  this.pub('loader:show');

  if( apiLoaded ) {
    next();
  }
  else {

    apiLoaded = true

    gmapsUtils.load(function(){
      next();
    });
  }
}

function onUpdateAfter(currentCtx, prevCtx) {

  setTimeout( function(){
    //console.log( 'update after',this, this.$, this.$[currentCtx.componentId], currentCtx.componentId);
    if( this.$[currentCtx.componentId] ) {
      this.$[currentCtx.componentId].$broadcast('route:startLoading');
    }

  }.bind(this),10);

  //this.$broadcast('route:startLoading');

}


