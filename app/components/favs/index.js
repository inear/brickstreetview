'use strict';

var fs = require('fs');
var _ = require('lodash');
var Vue = require('vue');
var Brickmarks = require('../../lib/brickmarks');

module.exports = {
  replace: true,
  mixins: [
    require('vue-mediator-mixin')
  ],
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),
  created: function() {

    _.bindAll(this, 'onOpen');

    for (var i = this.favList.length - 1; i >= 0; i--) {
      //this.favList[i].marginLeftClass = 'LegoTile-margin' + (Math.floor(Math.random() * 2) + 1) + '--left';
      this.favList[i].marginRightClass = 'LegoTile-margin1';// + (Math.floor(Math.random() * 4));
      this.favList[i].widthClass = 'LegoTile-pegs' + Math.floor(this.favList[i].label.length * 0.7);
    }

    this.sub('favs:open', this.onOpen);
  },

  beforeDestroy: function() {

  },

  ready: function() {

  },

  data: function() {
    return {
      shareUrl: '',
      imageUrl: '',
      showModal: false,
      favList: Brickmarks.getList()
    };
  },

  transitions: {
    emptyTransition: {
      enter: function (el, done) {
        setTimeout(done, 1500);
      },
      leave: function (el, done) {
        setTimeout(done, 500);
      }
    }
  },

  methods: {

    onClickLocation: function(item) {

      ga('send', 'event', 'brickmarks', 'click', item.label);

      Vue.navigate('/map/@' + item.location);
      this.hide();
    },

    onOpen: function() {
      this.show();
    },

    show: function() {
      this.showModal = true;
      this.pub('modal:open');
    },

    hide: function() {
      this.showModal = false;
      this.pub('modal:close');
    }
  }
};
