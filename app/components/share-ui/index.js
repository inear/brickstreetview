'use strict';

var fs = require('fs');
var _ = require('lodash');
var request = require('superagent');
var share = require('../../lib/share');

module.exports = {
  replace: true,
  mixins: [
    require('vue-mediator-mixin')
  ],
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),
  created: function() {

    _.bindAll(this, 'onImageCreated');

    this.sub('share:imageCreated', this.onImageCreated);
  },

  beforeDestroy: function() {

  },

  data: function() {
    return {
      shareUrl: '',
      imageUrl: '',
      showModal: false
    };
  },

  methods: {

    show: function() {
      console.log('show');
      this.shareUrl = window.location;
      this.showModal = true;
      this.pub('share:open');
    },

    hide: function() {
      this.showModal = false;
      this.pub('share:close');
    },

    onTwitter: function() {
      window.open(share.twitterUrl(this.shareUrl, 'Test message', this.imageUrl));
    },

    onFb: function() {
      window.open(share.fbUrl(this.shareUrl));
    },

    onGplus: function() {
      window.open(share.gplusUrl(this.shareUrl));
    },

    onImageCreated: function(img) {

      var self = this;

      self.show();

      var baseUrl = (location.origin.indexOf('localhost') !== -1)? 'http://localhost:8080' : location.origin;

      request
        .post(baseUrl + '/upload')
        .send({imgdata: img})
        //.set('X-API-Key', 'foobar')
        .set('Accept', 'application/json')
        .end(function(error, res) {
          if (error) {
            console.log(error);
            return;
          }

          self.imageUrl = baseUrl + '/serve/' +  JSON.parse(res.text).key;

        });
    }

  }
};
