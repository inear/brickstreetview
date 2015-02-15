'use strict';

var fs = require('fs');
var gmapsUtils = require('../../lib/gmaps-utils');
var textureOverlay = require('./texture-overlay');

module.exports = {
  replace: true,
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),

  ready: function() {
    this.$gmapContainer = document.querySelector('.CustomGMap-container');

    //_.bindAll(this, '');

    gmapsUtils.load(this.loadMap.bind(this));

  },
  methods: {
    loadMap: function(){

      var styleArray = [
        {"stylers": [
          { "visibility": "off" },
        ]},
        {
          "featureType": "landscape.man_made",
          "stylers": [
            { "visibility": "on" },
            { "hue": "#00ff11" },
            { "saturation": 53 },
            { "gamma": 0.26 },
            { "lightness": -75 }
          ]
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [
            { "visibility": "simplified" },
            { color: "#6C6E68" }
          ]
        },
        {
          featureType: "landscape.natural",
          elementType: "geometry",
          stylers: [
            { color: "#287f46" }
          ]
        },
        {
          "featureType": "landscape.man_made",
          "stylers": [
            { "visibility": "simplified" }
          ]
        },
        {
          "featureType": "road",
          "elementType": "labels.text.fill",
          "stylers": [
            { "visibility": "on" },
            { "color": "#FFF03A" }
          ]
        },
        {
          "featureType": "water",
          "elementType": "geometry.fill",
          "stylers": [
            { "visibility": "on" },
            { "color": "#4C61DB" }
          ]
        },
        {
          "featureType": "landscape.natural",
          "elementType": "geometry.fill",
          "stylers": [
            { "visibility": "on" },
            { "color": "#287f46" }
          ]
        }
      ];

      var defaultLatlng = new google.maps.LatLng(40.759101,-73.984406);

      var myOptions = {
        zoom: 16,
        center: defaultLatlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        tilt:45,
        disableDefaultUI:true,
        streetViewControl: false,
        styles: styleArray,
        scrollwheel: true,
      }

      this.map = new google.maps.Map( this.$gmapContainer, myOptions );

      //add pegs to google maps
      textureOverlay.init({el:document.querySelector('.CustomGMap-overlay'), map:this.map});


    }
  }
};
