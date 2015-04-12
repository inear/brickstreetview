'use strict';

var _ = require('lodash');
var fs = require('fs');
var textureOverlay = require('./texture-overlay');
var Draggable = require('draggable');
var THREE = require('three');
var raf = require('raf');
var BRIGL = require('brigl');
var parts = require('parts');
var TimelineMax = require('timelinemax');
var TweenMax = require('tweenmax');
var TILE_SIZE = 256;
var canvasUtils = require('../../lib/canvas-utils');
var Vue = require('vue');
var sv;
var request = require('superagent');

var builder = new BRIGL.Builder('/parts/ldraw/', parts, {
  dontUseSubfolders: true
});

module.exports = {
  replace: true,
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),

  mixins: [
    require('vue-mediator-mixin')
  ],

  events: {

  },

  data: function() {
    return {
      minifigDraggable: false
    };
  },

  compiled: function() {

    this.init3D();

    this.initLoader();
    //TweenMax.delayedCall(3, this.showLoader.bind(this));

    this.initMinifig();
    this.initTargetCircle();

    _.bindAll(this, 'onPreload');

    this.sub('routePreload:map', this.onPreload);

    /*Vue.nextTick(function(){
      this.initCompleted = true;
      this.$dispatch('load-complete');
    },this);*/

  },

  attached: function() {
    /*if( this.initCompleted ) {
      this.$dispatch('load-complete');
    }*/
    //this.$dispatch('load-complete');


    if (this.initCompleted && this.minifigDraggingInstance) {
      this.start();
      this.backToIdle();
    }

    window.addEventListener('resize', this.onResize);

  },

  detached: function() {
    this.isRunning = false;
    if (this.rafId) {
      raf.cancel(this.rafId);
      this.rafId = undefined;
    }

    this.scene.remove(this.loaderMesh);

    window.removeEventListener('resize', this.onResize);
  },

  ready: function() {

    this.gmapContainerEl = document.querySelector('.CustomGMap-container');
    this.gmapContainerWrapperEl = document.querySelector('.CustomGMap');
    this.minifigEl = document.querySelector('.CustomGMap-minifig');
    this.minifigCircleEl = document.querySelector('.CustomGMap-minifig-circle');
    this.threeEl = document.querySelector('.CustomGMap-three');

    _.bindAll(this,
      'onStartDragMinifig',
      'onEndDragMinifig',
      'onDragMinifig',
      'drawStreetViewTileToCanvas',
      'render',
      'onZoomChanged',
      'onResize',
      'loadingTransitionDone',
      'onTilesLoaded',
      'onPlaceChanged'
    );

    sv = new google.maps.StreetViewService();

    var defaultLatlng = new google.maps.LatLng(40.759101, -73.984406);

    var myOptions = {
      zoom: 17,
      center: defaultLatlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      tilt: 0,
      disableDefaultUI: true,
      streetViewControl: false,
      styles: require('./gmap-styles'),
      scrollwheel: true
    };

    this.map = new google.maps.Map(this.gmapContainerEl, myOptions);

    google.maps.event.addListener(this.map, 'zoom_changed', this.onZoomChanged);
    google.maps.event.addListener(this.map, 'tilesloaded', this.onTilesLoaded);

    var searchEl = document.querySelector('.SearchBar-input');
    this.autocomplete = new google.maps.places.Autocomplete(searchEl);
    this.autocomplete.bindTo('bounds', this.map);
    google.maps.event.addListener(this.autocomplete, 'place_changed', this.onPlaceChanged);

    var self = this;

    //wire button
    document.querySelector('.SearchBar-ok').addEventListener('click', function() {

      var firstResult = searchEl.value;

      var geocoder = new google.maps.Geocoder();
      geocoder.geocode({"address":firstResult }, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            self.map.setCenter(results[0].geometry.location);
          }
      });

    }.bind(this));


    this.tilesLoaded = false;

    this.streetviewCanvas = document.createElement('canvas');
    this.streetviewCanvas.width = 256;
    this.streetviewCanvas.height = 256;
    this.streetViewTileData = null;
    this.isLoadingStreetview = false;

    this.streetviewTileImg = document.createElement('img');
    this.streetviewTileImg.addEventListener('load', this.drawStreetViewTileToCanvas);

    //add pegs to google maps
    textureOverlay.init({
      el: document.querySelector('.CustomGMap-overlay'),
      map: this.map
    });

    this.mouse2d = new THREE.Vector2();
    this.frameTime = 0;
    this.size = {w: window.innerWidth, h: window.innerHeight};

    this.streetViewLayer = new google.maps.StreetViewCoverageLayer();
    this.isOverRoad = false;
    this.isDragging = false;
    this.threeEl.appendChild(this.renderer.domElement);

    this.minifigDraggingInstance = Draggable.create(this.minifigEl, {
      type: 'x,y',
      edgeResistance: 0.5,
      throwProps: true,
      bounds: window,
      onDragStart: this.onStartDragMinifig,
      onDragEnd: this.onEndDragMinifig,
      onDrag: this.onDragMinifig
    })[0];

    this.start();

    TweenMax.delayedCall(2, this.showMinifig);

  },

  methods: {

    onPreload: function() {

      var self = this;

      Vue.nextTick(function() {
        //this.minifigDraggable = true;
        this.initCompleted = true;
        this.$dispatch('load-complete');

        if (this.tilesLoaded) {
          this.$dispatch('init-complete');
        }
        else {
          this.$once('tilesLoaded', function() {
            self.$dispatch('init-complete');
          });
        }

      }, this);
    },

    onTilesLoaded: function() {

      this.tilesLoaded = true;
      this.$emit('tilesLoaded');
    },

    onPlaceChanged: function(){
      var place = this.autocomplete.getPlace();

      if (place.geometry.viewport) {
        this.map.fitBounds(place.geometry.viewport);
        this.map.setZoom(17);
      } else {
        this.map.setCenter(place.geometry.location);
        this.map.setZoom(17);  // Why 17? Because it looks good.
      }

    },

    start: function() {
      this.isRunning = true;
      this.render();
    },

    onMouseMove: function(event) {
      this.mouse2d.x = (event.clientX / this.size.w) * 2 - 1;
      this.mouse2d.y = -(event.clientY / this.size.h) * 2 + 1;
    },

    render: function() {

      if (this.isRunning) {
        this.rafId = raf(this.render);
      }

      this.frameTime += 0.01;

      this.loaderMesh.rotation.x += (this.mouse2d.x * -0.5 - this.loaderMesh.rotation.x) * 0.3;
      this.loaderMesh.rotation.z += ((this.mouse2d.y * 0.5 + Math.PI) - this.loaderMesh.rotation.z) * 0.3;

      if (this.minifigDraggable) {

        var toRot = -0.5 + this.mouse2d.x * -0.8;

        this.minifigMesh.brigl.animatedMesh.head.rotation.y += (toRot - this.minifigMesh.brigl.animatedMesh.head.rotation.y) * 0.3;
        this.minifigMesh.brigl.animatedMesh.hair.rotation.y += (toRot - this.minifigMesh.brigl.animatedMesh.hair.rotation.y) * 0.2;

        this.minifigMesh.brigl.animatedMesh.armL.rotation.x = 0.6 + Math.sin(this.frameTime) * 0.3 - 0.15;

      }

      this.updateTargetCircle();

      this.renderer.render(this.scene, this.camera);

    },

    onZoomChanged: function() {
      //var v = 1 + (this.map.zoom - 15) / 4;

      //this.minifigPivot.scale.set(v,v,v)
    },

    init3D: function() {

      this.projectionVector = new THREE.Vector3();

      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 3100);
      this.camera.position.y = 850;
      //this.camera.position.z = -20;
      this.camera.lookAt(this.scene.position);

      this.renderer = new THREE.WebGLRenderer({
        alpha: true
      });

      this.renderer.setSize(window.innerWidth - 1, window.innerHeight - 1);
      this.renderer.sortObjects = false;
      this.gammaInput = true;
      this.gammaOutput = true;

      var light = new THREE.PointLight(0xffffff, 0.3);
      light.position.copy(this.camera.position);
      light.position.x = 250;
      light.position.y = 900;
      light.position.z = 250;
      this.scene.add(light);

      light = new THREE.DirectionalLight(0xffffff, 0.7);
      light.position.set(100, 1000, 100);
      this.scene.add(light);

      this.brickContainer = new THREE.Object3D();
      //this.brickContainer.rotation.z = Math.PI;
      this.scene.add(this.brickContainer);

      //this.scene.add( new THREE.Mesh(new THREE.SphereGeometry(50,10,10), new THREE.MeshBasicMaterial({color:0xff0000})));

    },

    initLoader: function() {
      var self = this;

      this.previewCanvas = document.createElement('canvas');
      this.previewCanvas.width = 128;
      this.previewCanvas.height = 128;

      builder.loadModelByName('legoloader.ldr', {
        drawLines: false
      }, function(mesh) {

        var circleGeometry = new THREE.CircleGeometry(70, 12, 0, Math.PI * 0.5);
        circleGeometry.applyMatrix(new THREE.Matrix4().makeRotationY(Math.PI * 0.5).makeRotationX(Math.PI * 0.5));

        self.loadingMaterials = [];

        for (var i = 0; i < 4; i++) {

          var textureCanvas = document.createElement('canvas');
          textureCanvas.width = 128;
          textureCanvas.height = 128;

          var texture = new THREE.Texture(textureCanvas);

          self.loadingMaterials.push(new THREE.MeshLambertMaterial({color: 0xffffff, transparent: false, map: texture}));

          var circle = new THREE.Mesh(circleGeometry, self.loadingMaterials[i]);
          circle.position.set(-39, -1, 39);
          circle.rotation.y = Math.PI * 0.5;
          mesh.brigl.animatedMesh['part' + (i + 5)].add(circle);
        }

        self.loaderMesh = mesh;

      }, function(err) {
        console.log(err);
      });
    },

    loadPreview: function(id) {
      var self = this;

      this.currentPanoId = id;

      //load preview
      var img = new Image();
      img.crossOrigin = 'anonymous';

      var tileSize = 128;

      img.onload = function() {

        //original canvas

        var ctx = self.previewCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, tileSize, tileSize);

        canvasUtils.renderPreview(ctx, [{
          shape: 'brick',
          resolutionX: 4,
          resolutionY: 6,
          offset: [0, 0]
        }], tileSize, tileSize);

        for (var i = 0; i < 4; i++) {
          //rotated canvas
          var canvas = this.loadingMaterials[i].map.image;
          var rotCtx = canvas.getContext('2d');
          rotCtx.save();
          rotCtx.translate(tileSize * 0.5, tileSize * 0.5);
          rotCtx.rotate(i * Math.PI * 0.5);
          rotCtx.drawImage(self.previewCanvas, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
          rotCtx.restore();

          this.loadingMaterials[i].map.needsUpdate = true;
        }

        self.showLoader();

      }.bind(this);
      img.src = 'https://maps.googleapis.com/maps/api/streetview?size=128x128&pano=' + id + '&fov=120&heading=0&pitch=25';
    },

    showLoader: function() {
      var self = this;
      var i = 0;

      Object.keys(this.loaderMesh.brigl.animatedMesh).map(function(key) {

        var part = self.loaderMesh.brigl.animatedMesh[key];

        i++;

        part.visible = false;
        part.initPos = part.position.clone();

        var toPos = part.position.clone();
        toPos.y -= 10;
        var fromPos = part.initPos.clone();

        if (i === 1) {
          fromPos.x = 300;
          fromPos.y = -1100;
          fromPos.z = -300;
        }
        else if (i === 2) {
          fromPos.x = -300;
          fromPos.y = -1100;
          fromPos.z = -300;
        }
        else if (i === 3) {
          fromPos.x = -300;
          fromPos.y = -1100;
          fromPos.z = 300;
        }
        else if (i === 4) {
          fromPos.x = 300;
          fromPos.y = -1100;
          fromPos.z = 300;
        }
        else {
          fromPos.multiplyScalar(10);
        }

        part.position.copy(fromPos);

        TweenMax.to(part.position, 1, {
          ease: Sine.easeOut,
          x: toPos.x,
          y: toPos.y,
          z: toPos.z,
          delay: (i > 4) ? 0.5 + i * 0.2 : 0 + i * 0.2,
          onStart: function(item) {
            item.visible = true;
            TweenMax.from(item.rotation, 1, {
              x: Math.PI * 2.2,
              y: Math.PI * 1,
              z: Math.PI * 0.5,
              ease: Sine.easeOut
            });

          },
          onStartParams: [part],
          onComplete: function(item, partIndex) {
            TweenMax.to(item.position, 0, {
              ease: Sine.easeIn,
              x: item.initPos.x,
              y: item.initPos.y,
              z: item.initPos.z
            });

            if (partIndex >= 8) {
              TweenMax.delayedCall(0.6, self.loadingTransitionDone);
            }
         },
         onCompleteParams: [part, i]
        });

        //mesh.brigl.animatedMesh[key].initPos = mesh.brigl.animatedMesh[key].position.clone();
      });

      this.loaderMesh.position.set(0, 0, 0);
      //this.loaderMesh.rotation.set(0, Math.PI * -0.5, Math.PI + 10 * Math.PI / 180);
      //mesh.scale.set(0.2, 0.2, 0.2);
      this.scene.add(this.loaderMesh);
    },

    loadingTransitionDone: function() {
      this.pub('loader:show');
      Vue.navigate('/streetview/' + this.currentPanoId);
    },

    initTargetCircle: function() {

      var self = this;

      this.circleContainer3D = new THREE.Object3D();
      this.scene.add(this.circleContainer3D);

      builder.loadModelByName('4073.dat', {
        startColor: 23,
        drawLines: true
      }, function(mesh) {
        var newMesh;
        var angle;
        var r = 50;
        for (var i = 0; i < 10; i++) {
          newMesh = mesh.clone();
          newMesh.scale.set(0.8, 0.8, 0.8);
          newMesh.rotation.set(Math.random(), Math.random(), Math.random());
          angle = (Math.PI * 2) / 10;

          var phi = angle * i;
          var cx = r * Math.cos(phi);
          var cy = r * Math.sin(phi);

          newMesh.position.set(cx, 0, cy);
          self.circleContainer3D.add(newMesh);
        }

      }, function(err) {
        console.log(err);
      });

    },

    updateTargetCircle: function() {

      var children = this.circleContainer3D.children;
      var r, angle;

      if (this.isLoadingStreetview) {
        this.circleContainer3D.position.set(-10000, 0, 0);
        return;
        //this.circleContainer3D.position.x += (0 - this.circleContainer3D.position.x) * 0.5;
        //this.circleContainer3D.position.y += (0 - this.circleContainer3D.position.y) * 0.5;
        //this.circleContainer3D.position.z += (0 - this.circleContainer3D.position.z) * 0.5;
      }
      else if (!this.isDragging) {
        this.circleContainer3D.position.set(-10000, 0, 0);
        return;
      }
      else {
        var pos = this.minifigPivot.position.clone();
        var dir = pos.clone().sub(this.camera.position).normalize();
        dir.multiplyScalar(500);
        this.circleContainer3D.position.copy(pos).add(dir);
      }

      for (var i = 0; i < 10; i++) {

        /*if (this.isLoadingStreetview) {
          r = 90;
          children[i].rotation.x += (0 - children[i].rotation.x) * 0.3;
          children[i].rotation.y += (0 - children[i].rotation.y) * 0.3;
          children[i].rotation.z += (Math.PI - children[i].rotation.z) * 0.3;
        }
        else */if (this.isOverRoad) {

          r = 40;
          children[i].rotation.x += (0 - children[i].rotation.x) * 0.3;
          children[i].rotation.y += (0 - children[i].rotation.y) * 0.3;
          children[i].rotation.z += (Math.PI - children[i].rotation.z) * 0.3;
        } else {
          r = 50;
          children[i].rotation.z += 0.01 * i;
          children[i].rotation.x += 0.02;
          children[i].rotation.y += 0.02;
        }

        angle = (Math.PI * 2) / 10;

        var phi = angle * i;
        var cx = r * Math.cos(phi);
        var cy = r * Math.sin(phi);

        children[i].position.set(cx, 0, cy);
      }
    },


    initMinifig: function() {

      this.minifigDefaultPos = new THREE.Vector3(-36, 300, -22);

      this.minifigLocation = new google.maps.LatLng(0, 0);
      this.minifigDragY = 0;

      this.faceDecals = {};

      var self = this;
      //builder.loadModelFromLibrary("minifig.ldr", {drawLines: false}, function(mesh)

      builder.loadModelByName('minifig.ldr', {}, function(mesh) {

        //sjortcut to mesh
        self.minifigMesh = mesh;

        //move mesh so hand is center
        mesh.position.set(20, 0, -20);
        mesh.rotation.set(Math.PI * 0.5, 0, Math.PI * -0.5);

        var container = new THREE.Object3D();
        container.position.copy(self.minifigDefaultPos);
        self.minifigPivot = container;

        //var sphere = new THREE.Mesh(new THREE.SphereGeometry(6,6,6), new THREE.MeshBasicMaterial({color:0xff0000}));
        //container.add(sphere);

        container.add(mesh);
        self.scene.add(container);

        Object.keys(mesh.brigl.animatedMesh).map(function(key) {
          mesh.brigl.animatedMesh[key].initPos = mesh.brigl.animatedMesh[key].position.clone();
        });

        //swap material on head;
        var texture = THREE.ImageUtils.loadTexture('/images/face.png');
        texture.repeat.x = 3;
        texture.offset.x = -1;
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;

        self.faceDecals.idle = texture;

        texture = THREE.ImageUtils.loadTexture('/images/face-smile.png');
        texture.repeat.x = 3;
        texture.offset.x = -1;
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;

        self.faceDecals.smile = texture;

        var material = new THREE.MeshBasicMaterial({map: self.faceDecals.idle, transparent: true, side: THREE.DoubleSide});
        self.headMaterial = material;

        var decalMesh = new THREE.Mesh(new THREE.CylinderGeometry(14.5, 14.5, 18, 8, 1), material);
        decalMesh.position.y = 12;
        decalMesh.scale.y = -1;
        mesh.brigl.animatedMesh.head.add(decalMesh);


        //add decal to torso
        texture = THREE.ImageUtils.loadTexture('/images/shirt.png');
        texture.minFilter = THREE.LinearFilter;
        material = new THREE.MeshBasicMaterial({map: texture, transparent: true, side: THREE.DoubleSide});
        var torsoDecalMesh = new THREE.Mesh(new THREE.PlaneGeometry(35, 30, 1, 1), material);
        torsoDecalMesh.position.y = 15;
        torsoDecalMesh.position.z = -11;
        torsoDecalMesh.rotation.x = Math.PI - 0.08;
        mesh.brigl.animatedMesh.torso.add(torsoDecalMesh);


        //initPositions
        mesh.brigl.animatedMesh.torso.position.z -= 800;
        mesh.brigl.animatedMesh.armL.position.z -= 800;
        mesh.brigl.animatedMesh.armR.position.z -= 800;

        mesh.brigl.animatedMesh.legs.position.set(-300, 60, -800);
        mesh.brigl.animatedMesh.head.position.set(300, 300, -800);
        mesh.brigl.animatedMesh.hair.position.set(300, -300, -800);

        mesh.brigl.animatedMesh.legs.rotation.z = 5.3;
        mesh.brigl.animatedMesh.head.rotation.z = 3.1;
        mesh.brigl.animatedMesh.hair.rotation.z = 0.7;

      }, function(err) {
        console.log(err);
      });

    },

    showMinifig: function(){

      var self = this;
      var mesh = this.minifigMesh;

      TweenMax.to(mesh.brigl.animatedMesh.torso.position, 0.4, {z: mesh.brigl.animatedMesh.torso.position.z + 800});
      TweenMax.to(mesh.brigl.animatedMesh.armL.position, 0.4, {z: mesh.brigl.animatedMesh.armL.position.z + 800});
      TweenMax.to(mesh.brigl.animatedMesh.armR.position, 0.4, {z: mesh.brigl.animatedMesh.armR.position.z + 800});

      TweenMax.to(mesh.brigl.animatedMesh.legs.position, 0.4, {x: 0, y: 40, z: 0});
      TweenMax.to(mesh.brigl.animatedMesh.head.position, 0.4, {x: 0, y: -50, z: 0});
      TweenMax.to(mesh.brigl.animatedMesh.hair.position, 0.4, {x: 0, y: -70, z: 0});

      TweenMax.to(mesh.brigl.animatedMesh.legs.rotation, 0.4, {z: 0});
      TweenMax.to(mesh.brigl.animatedMesh.head.rotation, 0.4, {z: 0});
      TweenMax.to(mesh.brigl.animatedMesh.hair.rotation, 0.4, {z: 0});

      setTimeout(function() {

        TweenMax.to(mesh.brigl.animatedMesh.legs.position, 0.2, {
          delay: 0.4,
          y: mesh.brigl.animatedMesh.legs.initPos.y
        });
        TweenMax.to(mesh.brigl.animatedMesh.head.position, 0.2, {
          delay: 0.4,
          y: mesh.brigl.animatedMesh.head.initPos.y,
          onComplete: function() {

            TweenMax.to(mesh.brigl.animatedMesh.head.rotation, 0.2, {y: 0.3, ease: Sine.easeOut});
            TweenMax.to(mesh.brigl.animatedMesh.head.rotation, 0.5, {delay: 0.2, y: -0.6, ease: Back.easeOut});

            TweenMax.to(mesh.brigl.animatedMesh.hair.rotation, 0.2, {y: 0.3, ease: Sine.easeOut});

            TweenMax.to(mesh.brigl.animatedMesh.hair.rotation, 0.5, {delay: 0.2, y: -0.6, ease: Back.easeOut});

            TweenMax.to(mesh.brigl.animatedMesh.armL.rotation, 0.5, {x: 0.6, ease: Back.easeInOut});
            TweenMax.to(mesh.brigl.animatedMesh.armR.rotation, 0.5, {x: -0.6, ease: Back.easeInOut});

            TweenMax.to(mesh.brigl.animatedMesh.legL.rotation, 0.5, {x: 0.6, ease: Back.easeInOut});
            TweenMax.to(mesh.brigl.animatedMesh.legR.rotation, 0.5, {x: -0.6, ease: Back.easeInOut});

            TweenMax.to(self.minifigPivot.rotation, 0.5, {x: Math.PI * 0.2, ease: Sine.easeInOut});

            self.startHandHint();

            self.minifigDraggable = true;

          }
        });

        TweenMax.to(mesh.brigl.animatedMesh.hair.position, 0.2, {
          delay: 0.4,
          y: mesh.brigl.animatedMesh.hair.initPos.y
        });

      }, 200);

    },

    startHandHint: function() {
      var tl = new TimelineMax({delay: 6, repeatDelay: 6, repeat: -1});
      tl.insert(TweenMax.to(this.minifigMesh.brigl.animatedMesh.armR.brigl.animatedMesh.handR.rotation, 0.3, {z: Math.PI * 0.3, yoyo: true, repeat: 1, repeatDelay: 0, ease: Sine.easeInOut}));
    },

    stopHandHint: function() {
      TweenMax.killTweensOf(this.minifigMesh.brigl.animatedMesh.armR.brigl.animatedMesh.handR.rotation);
    },

    //from directive
    onCircleOver: function() {
      var hand = this.minifigMesh.brigl.animatedMesh.armR.brigl.animatedMesh.handR;
      hand.position.set(-8.16, 17.8729, -10);
      hand.translateZ(-3);

      this.headMaterial.map = this.faceDecals.smile;

    },

    onCircleOut: function() {
      var hand = this.minifigMesh.brigl.animatedMesh.armR.brigl.animatedMesh.handR;
      var toPos = new THREE.Vector3(-8.16, 17.8729, -10);
      TweenMax.to(hand.position, 0.3, {x: toPos.x, y: toPos.y, z: toPos.z});

      this.headMaterial.map = this.faceDecals.idle;
    },

    updateMinifigModelPosition: function(x, y) {
      //set minifig position
      if (this.minifigPivot) {

        this.projectionVector.set(x, y, -0.5);

        this.projectionVector.unproject(this.camera);
        var dir = this.projectionVector.sub(this.camera.position).normalize();
        var distance = -this.camera.position.y / dir.y;
        var pos = this.camera.position.clone().add(dir.multiplyScalar(distance));

        this.minifigPivot.position.x = pos.x;
        this.minifigPivot.position.z = pos.z;

        //this.circleContainer3D.position.x = pos.x;
        //this.circleContainer3D.position.z = pos.z
      }
    },

    onStartDragMinifig: function() {

      var self = this;

      TweenMax.to(this.minifigEl, 0.3, {opacity: 0});

      this.$parent.uiVisible = false;

      this.stopHandHint();
      this.minifigDraggable = false;
      this.isDragging = true;
      this.map.setOptions({scrollwheel: false});

      this.streetViewLayer.setMap(this.map);

      //$dragHideLayers.fadeOut()
      this.minifigEl.classList.add('dragging');

      //animate mesh
      var subMeshes = this.minifigMesh.brigl.animatedMesh;

      //minifigTalk('Now drop me somewhere');

      TweenMax.to(subMeshes.legR.rotation, 0.3, {
        x: 0.5
      });

      TweenMax.to(this.minifigPivot.rotation, 0.5, {
        x: Math.PI * -0.1,
        y: Math.PI * -0.2,
        z: Math.PI * -0.7,
        ease: Sine.easeInOut,
        onComplete: function() {

          TweenMax.to(subMeshes.legL.rotation, 0.5, {
            delay: 0.2,
            x: -0.8,
            yoyo: true,
            repeat: -1,
            ease: Sine.easeInOut
          });
          TweenMax.to(subMeshes.legR.rotation, 0.5, {
            delay: 0.2,
            x: -0.7,
            yoyo: true,
            repeat: -1,
            ease: Sine.easeInOut
          });

          TweenMax.to(self.minifigPivot.rotation, 0.5, {
            z: Math.PI * -0.4,
            yoyo: true,
            repeat: -1,
            ease: Sine.easeInOut,
            onUpdate: function() {
              self.minifigPivot.rotation.y += 0.01;
            }
          });

        }
      });

      TweenMax.to(subMeshes.armR.rotation, 0.5, {
        x: -Math.PI * 0.8,
        ease: Back.easeInOut
      });

      TweenMax.to(this.minifigPivot.position, 0.4, {
        y: this.minifigDragY,
        ease: Back.easeOut
      });

    },

    onDragMinifig: function(event) {

      var rect = this.minifigEl.getBoundingClientRect();

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
        x = offset.left + 0,
        y = offset.top + 0;


      if (event.touches && event.touches.length > 0) {
        this.updateMinifigModelPosition(
          (event.touches[0].clientX / window.innerWidth) * 2 - 1,
          -(event.touches[0].clientY / window.innerHeight) * 2 + 1
        );
      }
      else {
        this.updateMinifigModelPosition(
          (event.clientX / window.innerWidth) * 2 - 1,
          -(event.clientY / window.innerHeight) * 2 + 1
        );
      }


      this.minifigLocation = new google.maps.LatLng(
        startLat + ((y / window.innerHeight) * (endLat - startLat)),
        startLng + ((x / window.innerWidth) * (endLng - startLng))
      );

      var proj = this.map.getProjection();

      var numTiles = 1 << this.map.getZoom();
      var worldCoordinate = proj.fromLatLngToPoint(this.minifigLocation);

      var pixelCoordinate = new google.maps.Point(
        worldCoordinate.x * numTiles,
        worldCoordinate.y * numTiles);

      var tileCoordinate = new google.maps.Point(
        Math.floor(pixelCoordinate.x / TILE_SIZE),
        Math.floor(pixelCoordinate.y / TILE_SIZE));

      var localPixel = new google.maps.Point(pixelCoordinate.x % 256, pixelCoordinate.y % 256);

      var tileUrl = 'https://mts1.googleapis.com/vt?hl=sv-SE&lyrs=svv|cb_client:apiv3&style=40,18&x=' + tileCoordinate.x + '&y=' + tileCoordinate.y + '&z=' + this.map.getZoom();

      if (this.streetviewTileImg.src !== tileUrl) {
        this.streetviewTileImg.crossOrigin = '';
        this.streetviewTileImg.src = tileUrl;

      } else {
        if (this.streetViewTileData && this.streetViewTileData.length > 0) {
          //get pixel
          var index = (Math.floor(localPixel.y) * 256 + Math.floor(localPixel.x)) * 4;
          var trans = this.streetViewTileData[index];
          var blue = this.streetViewTileData[index - 1];
          var validColor = false;

          if (trans > 0 && blue === 132) {
            validColor = true;
          }

          if (validColor) {
            this.isOverRoad = true;
          } else if (!validColor) {
            this.isOverRoad = false;
          }
        }
      }
    },

    onEndDragMinifig: function() {

      var self = this;
      this.isDragging = false;

      this.headMaterial.map = this.faceDecals.idle;

      //_panoLoader.load(this.minifigLocation);
      this.streetViewLayer.setMap();

      sv.getPanoramaByLocation(this.minifigLocation, 50, function(data, status) {
        if (
          status === google.maps.StreetViewStatus.OK
          && data.links.length > 0
          && data.location.description !== 'Virtuo360'
          ) {
          /*
          position: data.location.latLng,

          title: data.location.description
          data.location.pano;*/
          console.log(data);

          /*request.withCredentials().get('http://maps.google.com/cbk?output=xml&ll='+ data.location.latLng.lat() + ',' + data.location.latLng.lng(), function(error, res) {
            if (error && error.status) {
              return;
            }
            else {
              console.log(res);
            }
          });
*/
          self.gotoStreetView(data);
           //self.backToIdle();

        } else {
          self.pub('loader:hide');
          self.backToIdle();
        }
      });
    },

    gotoStreetView: function(data) {

      var self = this;

      this.isLoadingStreetview = true;

      //this.gmapContainerWrapperEl.classList.add('tilted');
      this.minifigDraggingInstance.disable();

      //this.pub('loader:loadPano', data.location.pano);
      this.loadPreview(data.location.pano);

      var subMeshes = this.minifigMesh.brigl.animatedMesh;
      TweenMax.killTweensOf(this.minifigPivot.rotation);
      TweenMax.killTweensOf(subMeshes.legL.rotation);
      TweenMax.killTweensOf(subMeshes.legR.rotation);

      TweenMax.to(subMeshes.legL.rotation, 0.3, {x: 0, ease: Back.easeOut});
      TweenMax.to(subMeshes.legR.rotation, 0.3, {x: 0, ease: Back.easeOut});

      TweenMax.to(subMeshes.armR.rotation, 0.5, {
        x: 0, ease: Back.easeInOut
      });

      TweenMax.to(this.minifigPivot.rotation, 0.4, {
        x: 0,
        y: 0,
        z: Math.PI * -0.5
      });

      var pos = this.minifigPivot.position.clone();
      var dir = pos.clone().sub(this.camera.position).normalize();
      dir.multiplyScalar(600);
      pos.add(dir);

      TweenMax.to(this.minifigPivot.position, 0.2, {
        x: pos.x,
        y: pos.y - 50,
        z: pos.z + 40,
        onComplete: function() {
          TweenMax.to(self.minifigPivot.position, 0.8, {
            y: pos.y,
            ease: Bounce.easeOut,
            onComplete: function() {
            }
          });
        }
      });
    },

    backToIdle: function() {

      TweenMax.to(this.minifigEl,0.3,{opacity:1});
      this.$parent.uiVisible = true;
      this.isLoadingStreetview = false;
      this.startHandHint();
      this.minifigDraggingInstance.enable();
      this.map.setOptions({scrollwheel: true});
      //remove streetview layer

      var subMeshes = this.minifigMesh.brigl.animatedMesh;
      TweenMax.killTweensOf(this.minifigPivot.rotation);
      TweenMax.killTweensOf(subMeshes.legL.rotation);
      TweenMax.killTweensOf(subMeshes.legR.rotation);

      TweenMax.to(subMeshes.legL.rotation, 0.3, {
        x: 0.6, ease: Back.easeOut
      });
      TweenMax.to(subMeshes.legR.rotation, 0.3, {
        x: -0.6, ease: Back.easeOut
      });

      TweenMax.to(this.minifigPivot.rotation, 0.4, {
        x: Math.PI * 0.2,
        z: 0,
        y: 0
      });
      TweenMax.to(this.minifigPivot.position, 0.4, {
        x: this.minifigDefaultPos.x,
        y: this.minifigDefaultPos.y,
        z: this.minifigDefaultPos.z
      });
      //$('.js-bottom-instructions').html('Drag to look around');

      //minifigTalk('I hope there will be no snakes');
      var self = this;
      TweenMax.to(this.minifigEl, 0.3, {
        opacity: 0,
        onComplete: function() {
          //self.gmapContainerWrapperEl.classList.remove('tilted');
          TweenMax.set(self.minifigEl, {
            x: 0,
            y: 0,
            onComplete: function() {

              self.minifigDraggable = true;

              TweenMax.to(self.minifigEl, 0.3, {
                opacity: 1
              });
              TweenMax.to(self.minifigMesh.brigl.animatedMesh.armR.rotation, 0.5, {
                x: -0.6,
                ease: Back.easeInOut
              });
            }
          });
        }
      });

      //this.minifigCircleEl.classList.remove('over-road');

    },

    onResize: function() {

      var w = window.innerWidth;
      var h = window.innerHeight;

      this.size.w = w;
      this.size.h = h;

      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(w, h);

    },

    drawStreetViewTileToCanvas: function() {
      this.streetviewCanvas.width = this.streetviewCanvas.width;
      var ctx = this.streetviewCanvas.getContext('2d');

      ctx.drawImage(this.streetviewTileImg, 0, 0, 256, 256);
      this.streetViewTileData = ctx.getImageData(0, 0, 256, 256).data;
    }

  }
};
