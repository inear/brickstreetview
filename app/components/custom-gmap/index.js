'use strict';

var _ = require('lodash');
var fs = require('fs');
var gmapsUtils = require('../../lib/gmaps-utils');
var textureOverlay = require('./texture-overlay');
var Draggable = require('draggable');
var THREE = require('three');
var raf = require('raf');

var TILE_SIZE = 256;

module.exports = {
  replace: true,
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),

  ready: function() {
    this.gmapContainerEl = document.querySelector('.CustomGMap-container');
    this.pegmanEl = document.querySelector('.CustomGMap-pegman');
    this.threeEl = document.querySelector('.CustomGMap-three');

    _.bindAll(this, 'onStartDragPegman', 'onEndDragPegman','onDragPegman','drawStreetViewTileToCanvas','render');

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

      this.map = new google.maps.Map( this.gmapContainerEl, myOptions );

      this.streetviewCanvas = document.createElement('canvas');
      this.streetviewCanvas.width = 256;
      this.streetviewCanvas.height = 256;
      this.streetViewTileData = null;

      this.streetviewTileImg = document.createElement('img');
      this.streetviewTileImg.addEventListener('load',this.drawStreetViewTileToCanvas);

      //add pegs to google maps
      textureOverlay.init({el:document.querySelector('.CustomGMap-overlay'), map:this.map});

      this.streetViewLayer = new google.maps.StreetViewCoverageLayer();

      this.init3D();
      this.initPegman();

      this.render();
    },

    render: function(){
       this.rafId = raf(this.render);
       this.renderer.render(this.scene,this.camera);
    },

    init3D: function(){
      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 1, 3100 );
      this.camera.position.z = -100;
      this.camera.lookAt(this.scene.position);

      this.renderer = new THREE.WebGLRenderer({alpha:true});
      this.renderer.setSize( window.innerWidth, window.innerHeight );
      this.renderer.sortObjects = false;

      this.light = new THREE.DirectionalLight(0xffffff,0.6);
      this.light.position.z = -50;
      this.light.position.y = 100;
      this.scene.add(this.light);

      this.scene.add( new THREE.Mesh(new THREE.SphereGeometry(10,10,10), new THREE.MeshBasicMaterial({color:0xff0000})));

      this.threeEl.appendChild( this.renderer.domElement );
    },

    initPegman: function(){

      this.pegmanDraggingInstance = Draggable.create(this.pegmanEl, {
        type:"x,y",
        edgeResistance:0.5,
        throwProps:true,
        bounds:window,
        onDragStart:this.onStartDragPegman,
        onDragEnd:this.onEndDragPegman,
        onDrag:this.onDragPegman
      })[0];

      this.pegmanLocation = new google.maps.LatLng(0,0);
    },

    onDragPegman: function(event) {

      var rect = this.pegmanEl.getBoundingClientRect()

      var offset = {
        top: rect.top + document.body.scrollTop,
        left: rect.left + document.body.scrollLeft
      },
      bounds = this.map.getBounds(),
      neLatlng = bounds.getNorthEast(),
      swLatlng = bounds.getSouthWest(),
      startLat = neLatlng.lat(),
      endLng = neLatlng.lng(),
      endLat = swLatlng.lat(),
      startLng = swLatlng.lng(),
      x = offset.left + 50,
      y = offset.top + 50

      this.pegmanLocation = new google.maps.LatLng(
        startLat + ((y/window.innerHeight) * (endLat - startLat)),
        startLng + ((x/window.innerWidth) * (endLng - startLng))
      );

      var proj = this.map.getProjection();

      var numTiles = 1 << this.map.getZoom();
      var worldCoordinate = proj.fromLatLngToPoint( this.pegmanLocation );

      var pixelCoordinate = new google.maps.Point(
        worldCoordinate.x * numTiles,
        worldCoordinate.y * numTiles);

      var tileCoordinate = new google.maps.Point(
        Math.floor(pixelCoordinate.x / TILE_SIZE),
        Math.floor(pixelCoordinate.y / TILE_SIZE));

      var localPixel = new google.maps.Point(pixelCoordinate.x%256,pixelCoordinate.y%256);

      var tileUrl = 'https://mts1.googleapis.com/vt?hl=sv-SE&lyrs=svv|cb_client:apiv3&style=40,18&x='+tileCoordinate.x+'&y='+tileCoordinate.y+'&z=' + this.map.getZoom();

      if( this.streetviewTileImg.src !== tileUrl ){
        this.streetviewTileImg.crossOrigin = '';
        this.streetviewTileImg.src = tileUrl;

      }
      else {
        if(this.streetViewTileData && this.streetViewTileData.length > 0) {
          //get pixel
          var index = (Math.floor(localPixel.y) * 256 + Math.floor(localPixel.x)) * 4;
          var trans = this.streetViewTileData[index];
          var blue = this.streetViewTileData[index-1]
          var validColor = false;

          if( trans > 0 && blue === 132 ) {
            validColor = true;
          }
          if( validColor && !this.pegmanEl.classList.contains('road')) {
            this.pegmanEl.classList.add('road');
          }
          else if( !validColor && this.pegmanEl.classList.contains('road')){
            this.pegmanEl.classList.remove('road');
          }
        }
      }
    },

    onStartDragPegman: function (){

      this.streetViewLayer.setMap(this.map);

      //$dragHideLayers.fadeOut()
      this.pegmanEl.classList.add('dragging');

      //pegmanTalk('Now drop me somewhere');
    },

    onEndDragPegman: function ( event ){

      //remove streetview layer
      this.streetViewLayer.setMap();


      //$('.js-bottom-instructions').html('Drag to look around');

      //pegmanTalk('I hope there will be no snakes');


      //this.gmapContainerEl.classList.add('selected');
      //_panoLoader.load(this.pegmanLocation);
      //this.pegmanDraggingInstance.disable();

    },

    pegmanTalk: function( msg, timeout ){
      /*$message.html(msg);

      TweenMax.fromTo($message,0.3,{x:0},{x:10,yoyo:true});

      if( timeout ) {
        if( pegmanTimeout ) {
          clearTimeout(pegmanTimeout);
        }
        pegmanTimeout = setTimeout(function(){
          pegmanTalk(TALK_DEFAULT)
        },timeout*1000)
      }*/
    },

    drawStreetViewTileToCanvas: function(){
      this.streetviewCanvas.width = this.streetviewCanvas.width;
      var ctx = this.streetviewCanvas.getContext('2d');

      ctx.drawImage(this.streetviewTileImg,0,0,256,256);
      this.streetViewTileData = ctx.getImageData(0, 0, 256, 256).data;
    }


  }
};
