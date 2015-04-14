'use strict';

var fs = require('fs');
var _ = require('lodash');
var request = require('superagent');

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
    }
  },

  methods: {

    show: function(){
      console.log('show');
      this.shareUrl = window.location;
      this.showModal = true;
      this.pub('share:open');
    },

    hide: function( evt ){
      this.showModal = false;
      this.pub('share:close');
    },

    onImageCreated: function( img ) {

      var self = this;

      self.show();

      request
        .post('http://localhost:8080/upload')
        .send({ imgdata: img })
        //.set('X-API-Key', 'foobar')
        .set('Accept', 'application/json')
        .end(function(error, res){
          if(error) {
            console.log(error);
            return;
          }

          self.imageUrl = JSON.parse(res.text).url;

        });
    },

  }
};
