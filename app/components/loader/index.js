'use strict';

var fs = require('fs');
var _ = require('lodash');
var canvasUtils = require('../../lib/canvas-utils');

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
      'onLoaderHide',
      'onLoadPano'
    );

    this.sub('loader:loadPano', this.onLoadPano);
    this.sub('loader:show', this.onLoaderShow);
    this.sub('loader:hide', this.onLoaderHide);
  },

  ready: function() {

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
    },
    onLoaderHide: function() {
      this.show = false;
    },

    onLoadPano: function(id) {

      var img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = function() {

        var canvas = document.querySelector('.Loader-previewCanvas');
        canvas.width = 256;
        canvas.height = 256;
        var ctx = canvas.getContext('2d');
        ctx.mozImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(img, 0, 0, 256, 256);

        canvasUtils.renderPreview(ctx, [{
          shape: 'brick',
          resolutionX: 4,
          resolutionY: 8,
          offset: [0, 0]
        }], 256, 256);

        /*var texture = new THREE.Texture( canvas );
        texture.needsUpdate = true;

        var plane = new THREE.Mesh(new THREE.PlaneGeometry(512, 256), new THREE.MeshLambertMaterial({map: texture, side: THREE.DoubleSide}));
        this.scene.add(plane);
        plane.rotation.x = Math.PI*-0.5;
        plane.rotation.z = Math.PI*0.5;
        */

      }.bind(this);
      img.src = 'https://maps.googleapis.com/maps/api/streetview?size=512x256&pano=' + id + '&fov=120&heading=0&pitch=25';
    }
  }
};
