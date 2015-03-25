'use strict';

var fs = require('fs');
var _ = require('lodash');

module.exports = {
  replace: true,
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),
  mixins: [
    require('vue-mediator-mixin')
  ],

  created: function() {
    _.bindAll(
      this,
      'onLoaderShow',
      'onLoaderHide'
    );

    this.sub('loader:show', this.onLoaderShow);
    this.sub('loader:hide', this.onLoaderHide);
  },

  ready: function() {
    this.showTime = 0;
  },

  attached: function() {
    console.log('loader created');
  },

  data: function() {
    return {
      show: false
    };
  },

  methods: {
    onLoaderShow: function() {
      this.show = true;
      this.showTime = Date.now();
    },

    onLoaderHide: function() {
      if (Date.now() - this.showTime < 1000) {
        var self = this;
        setTimeout(function() {
          self.show = false;
        }, 500);
      }
      else {
        this.show = false;
      }

    }
  }
};
