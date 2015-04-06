'use strict';

var fs = require('fs');
var Vue = require('vue');
var _ = require('lodash');

module.exports = {
  replace: true,
  mixins: [
    require('vue-mediator-mixin')
  ],
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),
  created: function(){
  },

  /*transitions: {
    backButtonTransition: {
      beforeEnter: function (el) {
        // a synchronous function called right before the
        // element is inserted into the document.
        // you can do some pre-styling here to avoid
        // FOC (flash of content).
        console.log('beforeenter');
      },
      enter: function (el, done) {
        console.log('enter', el);
        //el.classList.remove('transition-out');
        el.classList.add('transition-in');
        done();
      },
      leave: function (el, done) {
        console.log('leave');
        el.classList.remove('transition-in');
        //el.classList.add('transition-out');
        setTimeout
        done();
      }
    }
  },
*/
  data: function(){
    return {

    }
  },

  beforeDestroy: function() {

  },

  methods: {
    onClick: function() {
      Vue.navigate('/map');
    }
  }
};
