'use strict';

var _ = require('lodash');
var fs = require('fs');
var gmapsUtils = require('../../lib/gmaps-utils');
var textureOverlay = require('./texture-overlay');
var Draggable = require('draggable');
var THREE = require('three');
var raf = require('raf');
var BRIGL = require('brigl');
//var parts = require('parts');
var TweenMax = require('tweenmax');
var TimelineMax = require('timelinemax');
var TILE_SIZE = 256;

module.exports = {
  replace: true,
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),

  ready: function() {
    this.gmapContainerEl = document.querySelector('.CustomGMap-container');
    this.minifigEl = document.querySelector('.CustomGMap-minifig');
    this.threeEl = document.querySelector('.CustomGMap-three');

    _.bindAll(this, 'onStartDragMinifig', 'onEndDragMinifig','onDragMinifig','drawStreetViewTileToCanvas','render');

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
      this.initMinifig();

      this.render();
    },

    render: function(){
      this.rafId = raf(this.render);
      if(this.testMesh) {
        //this.testMesh.rotation.y -= 0.005
        //this.testMesh.brigl.animatedMesh.head.rotation.x += 0.01;
      }

      this.renderer.render(this.scene,this.camera);
    },

    init3D: function(){
      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 1, 3100 );
      this.camera.position.y = 550;
      //this.camera.position.z = -200;
      this.camera.lookAt(this.scene.position);

      this.renderer = new THREE.WebGLRenderer({alpha:true});
      this.renderer.setSize( window.innerWidth, window.innerHeight );
      this.renderer.sortObjects = false;

      var light = new THREE.PointLight(0xffffff);
      light.position.set(0,650,0);
      this.scene.add(light);

      light = new THREE.DirectionalLight(0xaaaaaa);
      light.position.set(0,0,100);
      this.scene.add(light);

      this.brickContainer = new THREE.Object3D();
      this.brickContainer.rotation.z = Math.PI;
      this.scene.add(this.brickContainer);

      //this.scene.add( new THREE.Mesh(new THREE.SphereGeometry(50,10,10), new THREE.MeshBasicMaterial({color:0xff0000})));

      this.threeEl.appendChild( this.renderer.domElement );
    },

    initMinifig: function(){

      this.minifigDraggingInstance = Draggable.create(this.minifigEl, {
        type:"x,y",
        edgeResistance:0.5,
        throwProps:true,
        bounds:window,
        onDragStart:this.onStartDragMinifig,
        onDragEnd:this.onEndDragMinifig,
        onDrag:this.onDragMinifig
      })[0];

      this.minifigLocation = new google.maps.LatLng(0,0);

      var builder = new BRIGL.Builder("parts/ldraw/", {}, {dontUseSubfolders:true} );
      var self = this;
      //builder.loadModelFromLibrary("minifig.ldr", {drawLines: true}, function(mesh)
      builder.loadModelByUrl("models/minifig.ldr", {drawLines: false,blackLines:false}, function(mesh)
      {
        console.log(mesh)
        //mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1,1,-1).normalize(), 0);
        //mesh.geometry.computeVertexNormals();
        //mesh.geometry.applyMatrix( new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler(0,Math.PI,0)));

        mesh.rotation.x = Math.PI*-0.5;
        mesh.rotation.z = Math.PI*0.5;
        mesh.position.set(0,-300,0);
        setTimeout(function(){
          TweenMax.to(mesh.position,1,{delay:0.8,y:-200});

          var delay = 0;
          Object.keys( mesh.brigl.animatedMesh ).map(function( key ) {
            delay+=0.05;
            var origPos = mesh.brigl.animatedMesh[key].position.clone();
            TweenMax.fromTo(mesh.brigl.animatedMesh[key].position, 1, {x:origPos.x*20,y:origPos.y*20,z:origPos.z*20, ease:Sine.easeOut},{x:origPos.x*2,y:origPos.y*2,z:origPos.z*2, ease:Sine.easeOut});
            setTimeout(function(delay){
              TweenMax.to(mesh.brigl.animatedMesh[key].position, 0.1, {overwrite:0,delay:1+delay,x:origPos.x,y:origPos.y,z:origPos.z, ease:Sine.easeIn});
            }.bind(this,delay),      1000);

            TweenMax.from(mesh.brigl.animatedMesh[key].rotation, 1  , {x:Math.PI*Math.random(),y:Math.PI*Math.random(),z:Math.PI*Math.random()*4, ease:Sine.easeOut});
          });
        },2000)



        //var timeline = new TimelineMax()
        //timeline
        //TweenMax.to(mesh.rotation,2,{delay:1.2,x:0,y:0,z:0});

        mesh.scale.set(3,3,3);

        self.brickContainer.add(mesh);
        self.testMesh = mesh;

        //mesh.add( new THREE.VertexNormalsHelper(mesh,10));

      }, function(err){

        console.log(err)
      });

      /*request.get('/build/parts.js', function(res){
        console.log(res);
      });*/

    },

    onDragMinifig: function(event) {

      var rect = this.minifigEl.getBoundingClientRect()

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

      this.minifigLocation = new google.maps.LatLng(
        startLat + ((y/window.innerHeight) * (endLat - startLat)),
        startLng + ((x/window.innerWidth) * (endLng - startLng))
      );

      var proj = this.map.getProjection();

      var numTiles = 1 << this.map.getZoom();
      var worldCoordinate = proj.fromLatLngToPoint( this.minifigLocation );

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
          if( validColor && !this.minifigEl.classList.contains('road')) {
            this.minifigEl.classList.add('road');
          }
          else if( !validColor && this.minifigEl.classList.contains('road')){
            this.minifigEl.classList.remove('road');
          }
        }
      }
    },

    onStartDragMinifig: function (){

      this.streetViewLayer.setMap(this.map);

      //$dragHideLayers.fadeOut()
      this.minifigEl.classList.add('dragging');

      //minifigTalk('Now drop me somewhere');
    },

    onEndDragMinifig: function ( event ){

      //remove streetview layer
      this.streetViewLayer.setMap();


      //$('.js-bottom-instructions').html('Drag to look around');

      //minifigTalk('I hope there will be no snakes');


      //this.gmapContainerEl.classList.add('selected');
      //_panoLoader.load(this.minifigLocation);
      //this.minifigDraggingInstance.disable();

    },

    minifigTalk: function( msg, timeout ){
      /*$message.html(msg);

      TweenMax.fromTo($message,0.3,{x:0},{x:10,yoyo:true});

      if( timeout ) {
        if( minifigTimeout ) {
          clearTimeout(minifigTimeout);
        }
        minifigTimeout = setTimeout(function(){
          minifigTalk(TALK_DEFAULT)
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
