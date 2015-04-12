'use strict';

var fs = require('fs');
var _ = require('lodash');
var TweenMax = require('tweenmax');

module.exports = {
  replace: true,
  mixins: [
    require('vue-mediator-mixin')
  ],
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),

  ready: function() {
    _.bindAll(
      this,
      'onResize'
    );

    //window.addEventListener('resize', this.onResize);
  },

  beforeDestroy: function() {
    //window.removeEventListener('resize', this.onResize);
  },

  data: function(){
    return {
      //visible:false
    }
  },

  transitions: {
    searchBarTransition: {
      enter: function (el, done) {
        this.onResize();

        TweenMax.to(el,0.3,{y:66, ease: Sine.easeOut, onComplete: function(){
          done();
        }});
      },
      leave: function (el, done) {
        TweenMax.to(el,0.3,{y:-120, ease: Sine.easeIn, onComplete: function(){
          done();
        }});
      }
    }
  },

  methods: {
    onSubmit: function(){

    },
    onResize: function(){
      /*if(this.$el) {
        TweenMax.set(this.$el,{x: Math.round(window.innerWidth/22)*22 - 11*22 - 14*window.innerWidth/900});
      }*/
    },
  }
};
