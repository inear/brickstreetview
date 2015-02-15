'use strict';

var debug = require('debug');

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
    '/': {
      componentId: 'section-landing',
      isDefault: true
    },
    '/map': {
      componentId: 'section-map',
      isDefault: false
    }
  },

  components: {
    'section-landing': require('./sections/landing'),
    'section-map': require('./sections/map')
  }
});

