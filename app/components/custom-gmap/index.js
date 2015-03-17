'use strict';

var _ = require('lodash');
var fs = require('fs');
var gmapsUtils = require('../../lib/gmaps-utils');
var textureOverlay = require('./texture-overlay');
var Draggable = require('draggable');
var THREE = require('three');
var raf = require('raf');
var BRIGL = require('brigl');
var parts = require('parts');
var TweenMax = require('tweenmax');
var TimelineMax = require('timelinemax');
var TILE_SIZE = 256;
var Vue = require('vue');
var sv;

module.exports = {
  replace: true,
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),

  mixins: [
    require('vue-mediator-mixin')
  ],

  events: {

  },

  data: function(){
    return {
      minifigDraggable:false
    }
  },

  compiled: function(){

    this.init3D();
    this.initMinifig();

    _.bindAll(this, 'onPreload');

    this.sub('routePreload:map',this.onPreload);

    /*Vue.nextTick(function(){
      this.initCompleted = true;
      this.$dispatch('load-complete');
    },this);*/

  },

  attached: function(){
    /*if( this.initCompleted ) {
      this.$dispatch('load-complete');
    }*/
    //this.$dispatch('load-complete');

    if( this.initCompleted && this.minifigDraggingInstance) {
      this.start();
      this.backToIdle();
    }
  },

  detached: function(){

    this.isRunning = false;
    if(this.rafId) {
      raf.cancel(this.rafId);
      this.rafId = undefined;
    }
  },

  ready: function() {

    this.gmapContainerEl = document.querySelector('.CustomGMap-container');
    this.gmapContainerWrapperEl = document.querySelector('.CustomGMap');
    this.minifigEl = document.querySelector('.CustomGMap-minifig');
    this.minifigCircleEl = document.querySelector('.CustomGMap-minifig-circle');
    this.threeEl = document.querySelector('.CustomGMap-three');

    _.bindAll(this, 'onStartDragMinifig', 'onEndDragMinifig','onDragMinifig','drawStreetViewTileToCanvas','render','onZoomChanged','onResize');

    window.addEventListener('resize',this.onResize);

    sv = new google.maps.StreetViewService();

    var styleArray = require('./styles');

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

    google.maps.event.addListener(this.map, 'zoom_changed', this.onZoomChanged);

    this.streetviewCanvas = document.createElement('canvas');
    this.streetviewCanvas.width = 256;
    this.streetviewCanvas.height = 256;
    this.streetViewTileData = null;

    this.streetviewTileImg = document.createElement('img');
    this.streetviewTileImg.addEventListener('load',this.drawStreetViewTileToCanvas);

    //add pegs to google maps
    textureOverlay.init({el:document.querySelector('.CustomGMap-overlay'), map:this.map});

    this.streetViewLayer = new google.maps.StreetViewCoverageLayer();

    this.threeEl.appendChild( this.renderer.domElement );

    this.minifigDraggingInstance = Draggable.create(this.minifigEl, {
      type:"x,y",
      edgeResistance:0.5,
      throwProps:true,
      bounds:window,
      onDragStart:this.onStartDragMinifig,
      onDragEnd:this.onEndDragMinifig,
      onDrag:this.onDragMinifig
    })[0];

    this.start();


  },

  methods: {

    onPreload: function(){

      Vue.nextTick(function(){
        //this.minifigDraggable = true;
        this.initCompleted = true;
        this.$dispatch('load-complete');
      },this);
    },

    start: function(){

      this.isRunning = true;
      this.render();

    },

    render: function(){

      if( this.isRunning ) {
        this.rafId = raf(this.render);
      }

      this.renderer.render(this.scene,this.camera);
    },


    onZoomChanged: function(){
      var v = 1+ (this.map.zoom-15)/4;

      //this.minifigPivot.scale.set(v,v,v)
    },

    init3D: function(){

      this.projectionVector = new THREE.Vector3();

      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(40, window.innerWidth/window.innerHeight, 1, 3100 );
      this.camera.position.y = 850;
      //this.camera.position.z = -200;
      this.camera.lookAt(this.scene.position);

      this.renderer = new THREE.WebGLRenderer({alpha:true});

      this.renderer.setSize( window.innerWidth-1, window.innerHeight-1 );
      this.renderer.sortObjects = false;
      this.gammaInput = true;
      this.gammaOutput = true;
      var light = new THREE.PointLight(0xffffff,1);
      light.position.copy(this.camera.position);

      light.position.x = 250
      light.position.y = 500
      light.position.z = 250

      this.scene.add(light);

      light = new THREE.DirectionalLight(0xaaaaaa,0.8);
      light.position.set(100,1000,100);
      //this.scene.add(light);

      this.brickContainer = new THREE.Object3D();
      this.brickContainer.rotation.z = Math.PI;
      this.scene.add(this.brickContainer);

      //this.scene.add( new THREE.Mesh(new THREE.SphereGeometry(50,10,10), new THREE.MeshBasicMaterial({color:0xff0000})));

    },

    initMinifig: function(){

      this.minifigDefaultPos = new THREE.Vector3(26,-300,-25);


      this.minifigLocation = new google.maps.LatLng(0,0);

      var builder = new BRIGL.Builder("/parts/ldraw/", parts, {dontUseSubfolders:true} );
      var self = this;
      //builder.loadModelFromLibrary("minifig.ldr", {drawLines: false}, function(mesh)
      builder.loadModelByName("minifig.ldr", {}, function(mesh)
      {

        var pivotMesh = new THREE.Object3D();
        pivotMesh.add(mesh);
        pivotMesh.position.copy(self.minifigDefaultPos);

        //mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1,1,-1).normalize(), 0);

        Object.keys( mesh.brigl.animatedMesh ).map(function( key ) {
          mesh.brigl.animatedMesh[key].initPos = mesh.brigl.animatedMesh[key].position.clone();
        });

        //initPositions
        mesh.brigl.animatedMesh.legs.position.set(-60,60,0);
        mesh.brigl.animatedMesh.head.position.set(-60,-40,0);
        mesh.brigl.animatedMesh.hair.position.set(20,-80,0)

        mesh.brigl.animatedMesh.legs.rotation.z = 0.3;
        mesh.brigl.animatedMesh.head.rotation.z = 0.1
        mesh.brigl.animatedMesh.hair.rotation.z = 0.7

        mesh.rotation.x = Math.PI*-0.5;
        mesh.rotation.z = Math.PI*0.5;
        mesh.position.set(0,0,0);

        setTimeout(function(){

          TweenMax.to(mesh.brigl.animatedMesh.legs.position,0.4,{x:0});
          TweenMax.to(mesh.brigl.animatedMesh.head.position,0.4,{x:0});
          TweenMax.to(mesh.brigl.animatedMesh.hair.position,0.4,{x:0});

          TweenMax.to(mesh.brigl.animatedMesh.legs.rotation,0.4,{z:0});
          TweenMax.to(mesh.brigl.animatedMesh.head.rotation,0.4,{z:0});
          TweenMax.to(mesh.brigl.animatedMesh.hair.rotation,0.4,{z:0});

          setTimeout(function(){

            TweenMax.to(mesh.brigl.animatedMesh.legs.position,0.2,{delay:0.4,y:mesh.brigl.animatedMesh.legs.initPos.y});
            TweenMax.to(mesh.brigl.animatedMesh.head.position,0.2,{delay:0.4,y:mesh.brigl.animatedMesh.head.initPos.y, onComplete:function(){

              TweenMax.to(mesh.brigl.animatedMesh.head.rotation,0.2,{y:0.3, ease:Sine.easeOut})
              TweenMax.to(mesh.brigl.animatedMesh.head.rotation,0.5,{delay:0.2,y:-0.6, ease:Back.easeOut});

              TweenMax.to(mesh.brigl.animatedMesh.hair.rotation,0.2,{y:0.3, ease:Sine.easeOut})
              TweenMax.to(mesh.brigl.animatedMesh.hair.rotation,0.5,{delay:0.2,y:-0.6, ease:Back.easeOut});

              TweenMax.to(mesh.brigl.animatedMesh.armL.rotation,0.5,{x:0.6, ease:Back.easeInOut});
              TweenMax.to(mesh.brigl.animatedMesh.armR.rotation,0.5,{x:-0.6, ease:Back.easeInOut});

              TweenMax.to(mesh.brigl.animatedMesh.legL.rotation,0.5,{x:0.6, ease:Back.easeInOut})
              TweenMax.to(mesh.brigl.animatedMesh.legR.rotation,0.5,{x:-0.6, ease:Back.easeInOut});

              TweenMax.to(pivotMesh.rotation,0.5,{x:Math.PI*-0.2, ease:Sine.easeInOut});

              self.minifigDraggable = true;

            }});
            TweenMax.to(mesh.brigl.animatedMesh.hair.position,0.2,{delay:0.4,y:mesh.brigl.animatedMesh.hair.initPos.y});

          },200);
        },500);



        //var timeline = new TimelineMax()
        //timeline
        //TweenMax.to(mesh.rotation,2,{delay:1.2,x:0,y:0,z:0});

        mesh.scale.set(1,1,1);
        //move pivot center
        //mesh.position.x = -21;
        mesh.position.z = -25;
        mesh.position.x = -20;

        self.minifigPivot = pivotMesh;
        self.minifigMesh = mesh;

        self.brickContainer.add(pivotMesh);
        //pivotMesh.add( new THREE.Mesh(new THREE.SphereGeometry(10,3,3), new THREE.MeshBasicMaterial({color:0xff0000})));
        //TweenMax.to(self.minifigPivot.position,1,{delay:0.2,y:-300});

        //mesh.add( new THREE.VertexNormalsHelper(mesh,10));

      }, function(err){

        console.log(err)
      });

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
      x = offset.left+30,
      y = offset.top+30;


      this.updateMinifigModelPosition(
        ( event.clientX / window.innerWidth ) * 2 - 1,
        - ( event.clientY / window.innerHeight ) * 2 + 1
      );

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

          /*if( validColor && !this.minifigCircleEl.classList.contains('over-road')) {
            this.minifigCircleEl.classList.add('over-road');
          }
          else if( !validColor && this.minifigCircleEl.classList.contains('over-road')){
            this.minifigCircleEl.classList.remove('over-road');
          }*/
        }
      }
    },

    updateMinifigModelPosition: function( x, y ){
      //set minifig position
      if( this.minifigPivot ) {

        this.projectionVector.set(x,y,-0.5 );

        this.projectionVector.unproject( this.camera );
        var dir = this.projectionVector.sub( this.camera.position ).normalize();
        var distance = - this.camera.position.y / dir.y;
        var pos = this.camera.position.clone().add( dir.multiplyScalar( distance ) );

        this.minifigPivot.position.x = pos.x*-1;
        this.minifigPivot.position.z = pos.z
      }
    },

    onStartDragMinifig: function (){

      var self = this;

      this.minifigDraggable = false;

      this.streetViewLayer.setMap(this.map);

      //$dragHideLayers.fadeOut()
      this.minifigEl.classList.add('dragging');

      //animate mesh
      var subMeshes = this.minifigMesh.brigl.animatedMesh;

      //minifigTalk('Now drop me somewhere');

      TweenMax.to(subMeshes.legR.rotation,0.3,{x:0.5});

      TweenMax.to(this.minifigPivot.rotation,0.5,{x:Math.PI*-0.1,y:Math.PI*-0.2, z:Math.PI*-0.7, ease:Sine.easeInOut,onComplete:function(){

        TweenMax.to(subMeshes.legL.rotation,0.5,{delay:0.2,x:-0.8,yoyo:true,repeat:-1, ease:Sine.easeInOut})
        TweenMax.to(subMeshes.legR.rotation,0.5,{delay:0.2,x:-0.7,yoyo:true,repeat:-1, ease:Sine.easeInOut});

        TweenMax.to(self.minifigPivot.rotation,0.5,{z: Math.PI*-0.4,yoyo:true,repeat:-1,ease:Sine.easeInOut, onUpdate: function(){
          self.minifigPivot.rotation.y += 0.01;
        }});

      }});

      TweenMax.to(subMeshes.armR.rotation,0.5,{x:-Math.PI*0.8, ease:Back.easeInOut});
      TweenMax.to(this.minifigPivot.position,0.4,{y:0, ease:Back.easeOut});

    },

    onEndDragMinifig: function ( event ){

      var self = this;

      //_panoLoader.load(this.minifigLocation);

      sv.getPanoramaByLocation(this.minifigLocation, 50, function(data, status){
        if (status == google.maps.StreetViewStatus.OK) {
          /*
          position: data.location.latLng,

          title: data.location.description
          data.location.pano;*/
          console.log(data);

          self.gotoStreetView(data);

        }
        else {
          self.backToIdle();
        }
      });
    },

    gotoStreetView: function(data){

      this.gmapContainerWrapperEl.classList.add('tilted');

      this.minifigDraggingInstance.disable();

      var subMeshes = this.minifigMesh.brigl.animatedMesh;
      TweenMax.killTweensOf(this.minifigPivot.rotation);
      TweenMax.killTweensOf(subMeshes.legL.rotation);
      TweenMax.killTweensOf(subMeshes.legR.rotation);

      TweenMax.to(subMeshes.legL.rotation,0.3,{x:0, ease:Back.easeOut});
      TweenMax.to(subMeshes.legR.rotation,0.3,{x:0, ease:Back.easeOut});

      TweenMax.to(subMeshes.armR.rotation,0.5,{x:0, ease:Back.easeInOut});

      TweenMax.to(this.minifigPivot.rotation,0.4,{x:0,z:Math.PI*-0.5,y:0});

      var self = this;
      TweenMax.to(this.minifigPivot.position,0.2,{y:-50,onComplete:function(){
        TweenMax.to(self.minifigPivot.position,0.8,{y:0, ease:Bounce.easeOut,onComplete:function(){
          Vue.navigate('/streetview/' + data.location.pano );
        }});
      }});
    },

    backToIdle: function(){

      this.minifigDraggingInstance.enable();
      //remove streetview layer
      this.streetViewLayer.setMap();

      var subMeshes = this.minifigMesh.brigl.animatedMesh;
      TweenMax.killTweensOf(this.minifigPivot.rotation);
      TweenMax.killTweensOf(subMeshes.legL.rotation);
      TweenMax.killTweensOf(subMeshes.legR.rotation);

      TweenMax.to(subMeshes.legL.rotation,0.3,{x:0.6, ease:Back.easeOut});
      TweenMax.to(subMeshes.legR.rotation,0.3,{x:-0.6, ease:Back.easeOut});

      TweenMax.to(this.minifigPivot.rotation,0.4,{x:Math.PI*-0.2,z:0,y:0});
      TweenMax.to(this.minifigPivot.position,0.4,{x:this.minifigDefaultPos.x,z:this.minifigDefaultPos.z,y:-300});
      //$('.js-bottom-instructions').html('Drag to look around');

      //minifigTalk('I hope there will be no snakes');
      var self = this;
      TweenMax.to( this.minifigEl,0.3,{opacity:0, onComplete:function(){
        self.gmapContainerWrapperEl.classList.remove('tilted');
        TweenMax.set( self.minifigEl,{x:0,y:0, onComplete: function(){

          self.minifigDraggable = true;

          TweenMax.to( self.minifigEl,0.3,{opacity:1});
          TweenMax.to(self.minifigMesh.brigl.animatedMesh.armR.rotation,0.5,{x:-0.6, ease:Back.easeInOut});
        }});
      }});

      this.minifigCircleEl.classList.remove('over-road');

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

    onResize: function(){

      var w = window.innerWidth;
      var h = window.innerHeight;

      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize( w, h );

    },

    drawStreetViewTileToCanvas: function(){
      this.streetviewCanvas.width = this.streetviewCanvas.width;
      var ctx = this.streetviewCanvas.getContext('2d');

      ctx.drawImage(this.streetviewTileImg,0,0,256,256);
      this.streetViewTileData = ctx.getImageData(0, 0, 256, 256).data;
    }

  }
};
