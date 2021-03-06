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
      this.shareUrl = window.location;
      this.showModal = true;
      this.pub('share:open');
    },

    hide: function() {
      this.showModal = false;
      this.pub('share:close');
    },

    onTwitter: function() {
      window.open(share.twitterUrl(this.shareUrl, 'Brick Street View', this.imageUrl));
      ga('send', 'event', 'share', 'shortcuts', 'twitter');
    },

    onFb: function() {
      ga('send', 'event', 'share', 'shortcuts', 'fb');
      window.open(share.fbUrl(this.shareUrl));
    },

    onGplus: function() {
      window.open(share.gplusUrl(this.shareUrl));
      ga('send', 'event', 'share', 'shortcuts', 'gplus');
    },

    onImageCreated: function(img, panoInfo) {

      var self = this;

      ga('send', 'event', 'share', 'created');

      self.show();

      var baseUrl = (location.origin.indexOf('localhost') !== -1)? 'http://localhost:8080' : location.origin;

      request
        .post(baseUrl + '/upload')
        .send({
          'imgdata': img,
          'pano_id': panoInfo.pano,
          'location': panoInfo.latLng.toUrlValue(),
          'description': panoInfo.description})
        //.set('X-API-Key', 'foobar')
        .set('Accept', 'application/json')
        .end(function(error, res) {
          if (error) {
            console.log(error);
            return;
          }

          self.imageUrl = baseUrl + '/serve/' +  JSON.parse(res.text).key;

        });
    },

    downloadImage: function() {
      ga('send', 'event', 'share', 'download');
      window.open(this.imageUrl);
    },

    selectText: function(evt) {
      var range;
      console.log('select-text');
      if (document.selection) {
        range = document.body.createTextRange();
        range.moveToElementText(evt.target);
        range.select();
      } else if (window.getSelection) {
        range = document.createRange();
        range.selectNode(evt.target);
        window.getSelection().addRange(range);
      }
    }


  }
};
