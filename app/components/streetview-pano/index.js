'use strict';

var _ = require('lodash');
var fs = require('fs');
var THREE = require('three');
var WAGNER = require('wagner');
var GSVPANO = require('gsvpano');
var raf = require('raf');
var BRIGL = require('brigl');
var parts = require('parts');
var canvasUtils = require('../../lib/canvas-utils');
var panoUtils = require('../../lib/pano-utils');
var Nav = require('./nav');
var builder = new BRIGL.Builder('parts/ldraw/', parts, {
  dontUseSubfolders: true
});
var Vue = require('vue');

var lastRandomCarIndex = null;

module.exports = {
  replace: true,
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),

  mixins: [
    require('../../lib/vue-loader-mixin'),
    require('vue-mediator-mixin')
  ],

  events: {
    'load:progress': 'onLoadProgress',
    'load:complete': 'onAssetsLoaded'
  },

  manifest: [
    {
      id: 'ground',
      src: '/images/ground_darkgrey_128.jpg'
    },
    {
      id: 'sky',
      src: '/images/sky_128.jpg'
    }
  ],

  created: function(){
    _.bindAll(this,
      'render',
      'onResize',
      'onDepthError',
      'onDepthLoad',
      'onPreload',
      'onContainerMouseDown',
      'onContainerMouseMove',
      'onContainerMouseUp',
      'onContainerMouseWheel',
      'onContainerTouchStart',
      'onContainerTouchEnd',
      'onContainerTouchMove',
      'onTakePhoto',
      'onShareOpen',
      'onShareClose'
    );
  },

  ready: function() {

    this.threeEl = document.querySelector('.StreetviewPano-three');
    this.threeEl.appendChild(this.renderer.domElement);

    //use next time visited
    this.sub('routePreload:streetview', this.onPreload);
    this.sub('takePhoto', this.onTakePhoto);
    this.sub('share:open', this.onShareOpen);
    this.sub('share:close', this.onShareClose);

  },

  compiled: function() {
    this.isInitiated = true;
    this.blockInteractions = false;

    this.size = {
      w: window.innerWidth,
      h: window.innerHeight
    };

    this.imageDataLib = [];

    this.defaultLatlng = new google.maps.LatLng(40.759101, -73.984406);
    this.time = 0;
    this.isUserInteracting = false;
    this.isUserInteractingTime = 0;
    this.onMouseDownMouseX = 0;
    this.onMouseDownMouseY = 0;
    this.onMouseDownLon = 0;
    this.onMouseDownLat = 0;

    this.depthData = null;

    this.mouse2d = new THREE.Vector2();

    this.lon = 0;
    this.lat = 0;
    this.phi = 0;
    this.theta = 0;
    this.updatedTarget = new THREE.Vector3();
    this.target = new THREE.Vector3();

    this.isRunning = true;

    this.legoModels = [];

    //start the preloadjs mixin. Do just once.

    this.load();

  },

  attached: function() {

    this.$el.classList.add('grab');

    window.addEventListener('resize', this.onResize);

    this.container = this.$el;
    this.isRunning = true;
    this.initEvents();

    this.render();
  },

  detached: function() {

    this.lon = 0;
    this.lat = 0;
    this.isRunning = false;
    this.imageDataLib = [];

    while (this.plottedBricksContainer.children.length > 0) {
      var mesh = this.plottedBricksContainer.children.splice(0, 1)[0];
      mesh.parent.remove(mesh);
      mesh = null;
    }

    this.destroyLegoModels();
    this.removeEvents();

  },

  methods: {

    onPreload: function() {

      Vue.nextTick(function() {
        this.loadPanorama();
      }, this);
    },

    onLoadProgress: function(event) {
      console.log('load progress', event);
      this.progress = event.progress;
    },

    //when prealoadjs is complete loading textures
    onAssetsLoaded: function() {

      this.progress = 1;

      this.panoLoader = new GSVPANO.PanoLoader({
        zoom: 3
      });
      this.depthLoader = new GSVPANO.PanoDepthLoader();

      var self = this;

      this.panoLoader.onPanoramaLoad = function() {

        self.diffuseCanvas = this.canvas;
        //this.canvas.style.position = 'absolute';
        //document.body.appendChild(this.canvas);
        self.depthLoader.load(this.panoId);
        self.centerHeading = this.centerHeading;
        self.links = this.links;

        //self.currentPanoLocation = this.panoLocation.latLng;

      };

      this.depthLoader.onDepthLoad = this.onDepthLoad;
      this.depthLoader.onDepthError = this.onDepthError;

      this.nav = new Nav();

      this.init3D();
      this.initMaterials();
      this.initObjects();
      this.loadPanorama();

      this.onResize();

    },

    loadPanorama: function() {

      var panoid = this.$parent.$data.$routeParams.panoid;
      if (panoid) {
        this.panoLoader.loadId(panoid);
      } else {
        this.panoLoader.load(this.defaultLatlng);
      }

      console.time('panorama');
    },

    onDepthError: function() {
      //pegmanTalk("Snakes! Can't go there. Try another spot",4);
      console.timeEnd('panorama');

      this.panoramaLoaded = true;

      //var depthTexture = new THREE.Texture(this.preloader.getResult('depthFallback'));
      //this.mesh.material.uniforms.texture2.value = depthTexture;

      var diffuseW = this.diffuseCanvas.width;
      var diffuseH = this.diffuseCanvas.height;
      var diffuseCtx = this.diffuseCanvas.getContext('2d');

      canvasUtils.legofy(diffuseCtx, null, [{
        shape: 'brick',
        resolutionX: 8,
        resolutionY: 18,
        offset: [0, 0]
      }], diffuseW, diffuseH);

      this.mesh.material.uniforms.texture0.value.image = this.diffuseCanvas;
      this.mesh.material.uniforms.texture0.value.needsUpdate = true;

      this.groundTile.repeat.set(400, 400);

      Vue.nextTick(function() {
        this.firstInitDone = true;
        this.$dispatch('load-complete');
        this.$dispatch('init-complete');
      }, this);
    },

    onDepthLoad: function(buffers) {

      var x, y, w, h, c, pointer;

      if (!this.depthCanvas) {
        this.depthCanvas = document.createElement('canvas');
        this.depthCanvas.style.position = 'absolute';
        this.depthCanvas.style.zIndex = 100;
        //document.body.appendChild(this.depthCanvas);
      }

      this.groundTile.repeat.set(200, 200);

      var depthCtx = this.depthCanvas.getContext('2d');

      w = buffers.width;
      h = buffers.height;

      this.depthCanvas.setAttribute('width', w);
      this.depthCanvas.setAttribute('height', h);

      var depthImg = depthCtx.getImageData(0, 0, w, h);

      for (y = 0; y < h; ++y) {
        for (x = 0; x < w; ++x) {
          c = buffers.depthMap[y * w + x] / 50 * 255;
          depthImg.data[4 * (y * w + x)] = c;
          depthImg.data[4 * (y * w + x) + 1] = c;
          depthImg.data[4 * (y * w + x) + 2] = c;
          depthImg.data[4 * (y * w + x) + 3] = 255;
        }
      }

      this.imageDataLib.depth = buffers.depthMap;

      depthCtx.putImageData(depthImg, 0, 0);

      this.mesh.material.uniforms.texture2.value.image = this.depthCanvas;
      this.mesh.material.uniforms.texture2.value.needsUpdate = true;

      if (!this.normalCanvas) {
        this.normalCanvas = document.createElement('canvas');
        this.normalCanvas.style.position = 'absolute';
        this.normalCanvas.style.zIndex = 100;
        //document.body.appendChild(this.normalCanvas);
      }

      //create normal texture
      var normalCtx = this.normalCanvas.getContext('2d');

      w = buffers.width;
      h = buffers.height;

      this.normalCanvas.setAttribute('width', w);
      this.normalCanvas.setAttribute('height', h);

      var normalImage = normalCtx.getImageData(0, 0, w, h);
      pointer = 0;

      var pixelIndex;

      for (y = 0; y < h; ++y) {
        for (x = 0; x < w; ++x) {
          pointer += 3;
          pixelIndex = (y * w + (w - x)) * 4;
          normalImage.data[pixelIndex] = (buffers.normalMap[pointer] + 1) / 2 * 255;
          normalImage.data[pixelIndex + 1] = (buffers.normalMap[pointer + 1] + 1) / 2 * 255;
          normalImage.data[pixelIndex + 2] = (buffers.normalMap[pointer + 2] + 1) / 2 * 255;
          normalImage.data[pixelIndex + 3] = 255;
        }
      }

      this.imageDataLib.normal = normalImage.data;

      normalCtx.putImageData(normalImage, 0, 0);

      //legofy
      var diffuseW = this.diffuseCanvas.width;
      var diffuseH = this.diffuseCanvas.height;
      var diffuseCtx = this.diffuseCanvas.getContext('2d');

      canvasUtils.legofy(diffuseCtx, normalCtx, [{
        shape: 'brick',
        resolutionX: 8,
        resolutionY: 18,
        offset: [0, 0]
      }], diffuseW, diffuseH);

      //assign to shader
      this.mesh.material.uniforms.texture0.value.image = this.diffuseCanvas;
      this.mesh.material.uniforms.texture0.value.needsUpdate = true;

      this.mesh.material.uniforms.texture1.value.image = this.normalCanvas;
      this.mesh.material.uniforms.texture1.value.needsUpdate = true;

      this.panoramaLoaded = true;

      console.timeEnd('panorama');

      this.loadLegoModels();

    },

    init3D: function() {

      this.projectionVector = new THREE.Vector3();
      this.raycaster = new THREE.Raycaster();

      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.Fog(0x024b7d, 800, 3000);

      this.camera = new THREE.PerspectiveCamera(60, this.size.w / this.size.h, 1, 3100);

      this.renderer = new THREE.WebGLRenderer({
        preserveDrawingBuffer:false,
        alpha: true
      });
      this.renderer.autoClear = false;
      this.renderer.autoClearColor = false;
      this.renderer.setClearColor(0x4c8b56, 0);
      this.renderer.setSize(this.size.w, this.size.h);
      this.renderer.sortObjects = false;
      this.gammaInput = true;
      this.gammaOutput = true;

      //post effects
      WAGNER.vertexShadersPath = '/vertex-shaders';
      WAGNER.fragmentShadersPath = '/fragment-shaders';
      WAGNER.assetsPath = '/assets';

      this.composer = new WAGNER.Composer(this.renderer);
      this.copyPass = new WAGNER.CopyPass();
      this.noisePass = new WAGNER.NoisePass();
      this.noisePass.params.amount = 0.05;
      this.fxaaPass = new WAGNER.FXAAPass();
      this.vignettePass = new WAGNER.VignettePass();
      this.vignettePass.params.amount = 0.5;

      //lights
      this.light = new THREE.DirectionalLight(0xffffff, 0.6);
      this.light.position.z = 50;
      this.light.position.y = 100;
      this.scene.add(this.light);
      this.scene.add(new THREE.AmbientLight(0x111111, 0.1));

      var pointLight = new THREE.PointLight(0xffffff, 0.2, 2700);
      pointLight.position.set(-50, 50, 0);
      this.scene.add(pointLight);

      var pointLight2 = new THREE.PointLight(0xffffff, 0.3);
      pointLight2.position.set(1320, 1030, 60);
      this.scene.add(pointLight2);

      //this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(50,10,10), new THREE.MeshBasicMaterial({color:0xff0000})));

    },

    initMaterials: function() {

      THREE.ImageUtils.crossOrigin = 'anonymous';

      var groundMaskUniforms = {
        texture0: {
          type: 't',
          value: new THREE.Texture()
        },
        texture1: {
          type: 't',
          value: new THREE.Texture()
        },
        texture2: {
          type: 't',
          value: new THREE.Texture()
        }
      };

      var params = {
        uniforms: groundMaskUniforms,
        vertexShader: require('./streetview_vs.glsl'),
        fragmentShader: require('./streetview_fs.glsl'),
        side: THREE.DoubleSide,
        transparent: true,
        lights: false
      };

      this.maskMaterial = new THREE.ShaderMaterial(params);

      var skyTile = new THREE.Texture(this.preloader.getResult('sky'));

      skyTile.repeat.set(25, 25);
      skyTile.wrapS = skyTile.wrapT = THREE.RepeatWrapping;
      skyTile.needsUpdate = true;

      var wallTile = new THREE.Texture(this.preloader.getResult('sky'));
      wallTile.repeat.set(25, 17);
      wallTile.wrapS = wallTile.wrapT = THREE.RepeatWrapping;
      wallTile.needsUpdate = true;

      var groundTile = new THREE.Texture(this.preloader.getResult('ground'));
      groundTile.repeat.set(200, 200);
      groundTile.wrapS = groundTile.wrapT = THREE.RepeatWrapping;
      groundTile.needsUpdate = true;

      this.groundTile = groundTile;

      this.boxMaterial = new THREE.MeshFaceMaterial([
        new THREE.MeshBasicMaterial({
          map: wallTile,
          color: 0xffffff,
          specular: 0xffffff,
          ambient: 0x444444,
          side: THREE.DoubleSide
        }),
        new THREE.MeshBasicMaterial({
          map: wallTile,
          color: 0xffffff,
          specular: 0xffffff,
          ambient: 0x444444,
          side: THREE.DoubleSide
        }),
        new THREE.MeshBasicMaterial({
          map: skyTile,
          color: 0xffffff,
          specular: 0xffffff,
          ambient: 0x444444,
          side: THREE.DoubleSide
        }),
        new THREE.MeshBasicMaterial({
          map: groundTile,
          color: 0xffffff,
          specular: 0xffffff,
          ambient: 0x444444,
          side: THREE.DoubleSide
        }),
        new THREE.MeshBasicMaterial({
          map: wallTile,
          color: 0xffffff,
          specular: 0xffffff,
          ambient: 0x444444,
          side: THREE.DoubleSide
        }),
        new THREE.MeshBasicMaterial({
          map: wallTile,
          color: 0xffffff,
          specular: 0xffffff,
          ambient: 0x444444,
          side: THREE.DoubleSide
        })
      ]);
    },

    initObjects: function() {

      this.mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1000, 80, 40, 0, Math.PI * 2, Math.PI * 0.1, Math.PI * 0.65),
        this.maskMaterial
      );
      this.scene.add(this.mesh);

      this.mesh.scale.x = -1;
      this.mesh.position.y = -200;

      this.backgroundContainer = new THREE.Object3D();
      this.scene.add(this.nav.container);
      this.scene.add(this.backgroundContainer);


      var skyGeo = new THREE.BoxGeometry(3000, 2000, 3000, 1, 1, 1);
      this.sky = new THREE.Mesh(skyGeo, this.boxMaterial);
      this.sky.position.y = 1000;

      this.backgroundContainer.add(this.sky);

      this.target = new THREE.Vector3();
      this.camera.lookAt(this.target);

      this.plottedBricksContainer = new THREE.Object3D();
      this.scene.add(this.plottedBricksContainer);

    },

    loadLegoModels: function() {
      console.time('legoModels');
      var self = this;
      var loadOnceList = require('./model-list');

      var dynamicList = [
        /*{
          name:'spaceship.ldr',
          callback: function(self,mesh) {

            mesh.rotation.set(0,0,Math.PI*1.2)
            mesh.scale.set(0.40,0.40,0.40);
            mesh.position.set(130,70,120);
            self.scene.add(mesh);
          }
        },*/

        {
          name: randomCar(),
          callback: function(scope, mesh) {
            doWithAllCars(mesh);
            mesh.position.set(20 + Math.random() * 80, 0, -10);
          }
        },
        {
          name: randomCar(),
          callback: function(scope, mesh) {
            doWithAllCars(mesh);
            mesh.position.set(-40 - Math.random()*60, 0, -10);
          }
        },

        //tree
        {
          name: '3470.dat',
          color: 2,
          destroy: true,
          callback: function(scope, mesh) {

            mesh.rotation.set(0, 0, Math.PI);
            mesh.scale.set(0.2, 0.2, 0.2);
            mesh.position.set(0, 0, 0);

            self.treeMesh = mesh;

            /*var newMesh;
            for (var i = 0; i < 5; i++) {
              for (var j = 0; j < 2; j++) {
                if (i === 2) {
                  continue;
                }
                newMesh = mesh.clone();
                newMesh.rotation.set(0, 0, Math.PI);
                newMesh.scale.set(0.20, 0.20, 0.20);
                newMesh.position.set(i * 100 - 200, -19, 80 * ((j === 0) ? -1 : 1));
                scope.scene.add(newMesh);
                scope.legoModels.push(newMesh);
              }
            }*/
          }
        }
      ];

      function doWithAllCars(mesh) {

        if (mesh.name.indexOf('6910') !== -1) {
          mesh.rotation.set(0, 0, Math.PI);
        }
        else {
          mesh.rotation.set(0, Math.PI * 0.5, Math.PI);
        }

        mesh.scale.set(0.10, 0.10, 0.10);
        mesh.geometry.computeBoundingBox();
        var bb = mesh.geometry.boundingBox;
        mesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, bb.min.y, 0));

        self.scene.add(mesh);
        self.legoModels.push(mesh);
      }

      function randomCar() {
        var list = [
          '8195turbotow.ldr',
          '8303demondestroyer.ldr'/*,
          '6910a.dat',
          '6910b.dat',
          '8664roadhero.ldr',
          '30033truck.ldr',
          'police.ldr',
          'jeep.ldr',
          'minicar.ldr',
          'minispeeder.ldr',
          'minitruck.ldr',
          'simplecar.mpd'*/
        ];

        var selectedIndex = Math.floor(Math.random() * list.length);
        while (selectedIndex === lastRandomCarIndex) {
          selectedIndex = Math.floor(Math.random() * list.length);
        }

        lastRandomCarIndex = selectedIndex;

        return list[selectedIndex];
      }

      function loadNextModel() {

        if (loadOnceList.length === 0 && dynamicList.length === 0) {
          allLoadingDone();
          return;
        }

        var item;

        if (loadOnceList.length > 0) {
          item = loadOnceList.splice(0, 1)[0];
        } else {
          item = dynamicList.splice(0, 1)[0];
          item.isDynamic = true;
        }

        builder.loadModelByName(item.name, {
          drawLines: false,
          startColor: item.color,
          optimized:true
        }, function(mesh) {
          mesh.name = item.name
          item.callback(self, mesh);

          loadNextModel();
        }, function(err) {
          console.log(err);
          loadNextModel();
        });
      }

      function allLoadingDone() {

        console.timeEnd('legoModels');

        self.legoModelsLoaded();

      }

      loadNextModel();

    },

    legoModelsLoaded: function() {

      Vue.nextTick(function() {
        this.firstInitDone = true;
        this.nav.setLinks(this.links, this.centerHeading);
        this.addBricksAlongEdge();
        this.$dispatch('load-complete');
        this.$dispatch('init-complete');
      }, this);
    },

    destroyLegoModels: function() {
      var mesh;
      for (var i = 0; i < this.legoModels.length; i++) {
        mesh = this.legoModels[i];
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh = null;
      }

      this.legoModels.length = 0;
    },


    addBricksAlongEdge: function() {
      var divider = 4;//(detector.isMobile?16:8);
      var totalPlants = 512 / divider;
      var treesTotal = 0;

      for (var i = 0; i < totalPlants; i++) {

        var point = panoUtils.get3DPointAtEdge(this.normalCanvas.getContext('2d'), i * divider);
        if (point) {
          var reflectedPoint = point.clone();
          //reflectedPoint.z *= -1;

          var pointData = panoUtils.getPointData(this.imageDataLib.normal, this.imageDataLib.depth, reflectedPoint);

          panoUtils.plotOnTexture(this.mesh.material.uniforms.texture1.value, reflectedPoint);

          var distanceToCamera = pointData.distance;
          var pointInWorld = point.normalize().multiplyScalar(distanceToCamera * 8.1);

          if (distanceToCamera > 50) {
            continue;
          }

          pointInWorld.x = Math.round(pointInWorld.x / 8.1) * 8.1;
          pointInWorld.z = Math.round(pointInWorld.z / 8.1) * 8.1;
          pointInWorld.y = 0;// -5;//Math.round(pointInWorld.y / 1) * 1;

          var roadWidth = 50;
          if (pointInWorld.x > -roadWidth && pointInWorld.x < roadWidth) {
            continue;
          }

          if (pointInWorld.z > -roadWidth && pointInWorld.z < roadWidth) {
            continue;
          }

          //create geo
          var newBrick;
          if (Math.random() > 0.8 && treesTotal < 8) {
            treesTotal++;
            newBrick = this.treeMesh.clone();
          }
          else {
            newBrick = this.buildBrick.clone();
          }

          newBrick.position.copy(pointInWorld);

          this.plottedBricksContainer.add(newBrick);

        }
      }
    },

    initEvents: function() {
      //$(this.renderer.domElement).on('click', this.onSceneClick);
      this.container.addEventListener('mousedown', this.onContainerMouseDown, false);
      this.container.addEventListener('mousemove', this.onContainerMouseMove, false);
      this.container.addEventListener('mouseup', this.onContainerMouseUp, false);
      this.container.addEventListener('mousewheel', this.onContainerMouseWheel, false);

      this.container.addEventListener('touchstart', this.onContainerTouchStart, false);
      this.container.addEventListener('touchend', this.onContainerTouchEnd, false);
      //this.container.addEventListener('touchcancel', this.onContainerTouchEnd, false);
      this.container.addEventListener('touchmove', this.onContainerTouchMove, false);
    },

    removeEvents: function() {
      this.container.removeEventListener('mousedown', this.onContainerMouseDown);
      this.container.removeEventListener('mousemove', this.onContainerMouseMove);
      this.container.removeEventListener('mouseup', this.onContainerMouseUp);
      this.container.removeEventListener('mousewheel', this.onContainerMouseWheel);

      this.container.removeEventListener('touchstart', this.onContainerTouchStart);
      this.container.removeEventListener('touchend', this.onContainerTouchEnd);
      //this.container.removeEventListener('touchcancel', this.onContainerTouchEnd);
      this.container.removeEventListener('touchmove', this.onContainerTouchMove);
    },


    onContainerMouseDown: function(event) {

      event.preventDefault();
      this.isUserInteracting = true;
      this.isUserInteractingTime = Date.now();

      this.onPointerDownPointerX = event.clientX;
      this.onPointerDownPointerY = event.clientY;

      this.onPointerDownLon = this.lon;
      this.onPointerDownLat = this.lat;

      this.mouse2d.x = (event.clientX / this.size.w) * 2 - 1;
      this.mouse2d.y = -(event.clientY / this.size.h) * 2 + 1;

      this.$el.classList.remove('grab');
      this.$el.classList.add('grabbing');

    },

    onContainerMouseMove: function(event) {

      event.preventDefault();

      if (this.isUserInteracting) {

        this.lon = (this.onPointerDownPointerX - event.clientX) * 0.1 + this.onPointerDownLon;
        this.lat = (event.clientY - this.onPointerDownPointerY) * 0.1 + this.onPointerDownLat;

      }

      this.mouse2d.x = (event.clientX / this.size.w) * 2 - 1;
      this.mouse2d.y = -(event.clientY / this.size.h) * 2 + 1;
      /*
        delta = Date.now()-lastTime;
        lastTime = Date.now();
        $('#debug').text(delta);
      */
    },

    onContainerMouseUp: function(event) {
      this.isUserInteracting = false;
      /*
      if (Date.now() - this.isUserInteractingTime < 300) {
        this.onSceneClick(this.mouse2d.x, this.mouse2d.y);
      }
      */
      this.$el.classList.add('grab');
      this.$el.classList.remove('grabbing');

    },

    onContainerMouseWheel: function(event) {
      this.camera.fov -= event.wheelDeltaY * 0.05;

      this.camera.fov = Math.min(80, Math.max(40, this.camera.fov));
      this.camera.updateProjectionMatrix();
    },

    onContainerTouchStart: function(event) {

      if (event.touches.length === 1) {

        event.preventDefault();

        this.isUserInteractingTime = Date.now();
        this.isUserInteracting = true;

        this.onPointerDownPointerX = event.touches[0].pageX;
        this.onPointerDownPointerY = event.touches[0].pageY;

        this.mouse2d.x = (event.touches[0].pageX / this.size.w) * 2 - 1;
        this.mouse2d.y = -(event.touches[0].pageY / this.size.h) * 2 + 1;

        this.onPointerDownLon = this.lon;
        this.onPointerDownLat = this.lat;

      }

    },

    onContainerTouchEnd: function(event) {

      //event.preventDefault();

      this.isUserInteracting = false;
      /*
      if (Date.now() - this.isUserInteractingTime < 300) {
        this.onSceneClick(this.mouse2d.x, this.mouse2d.y);
      }
      */
    },

    onContainerTouchMove: function(event) {

      if (event.touches.length === 1) {

        event.preventDefault();

        this.lon = (this.onPointerDownPointerX - event.touches[0].pageX) * 0.1 + this.onPointerDownLon;
        this.lat = (event.touches[0].pageY - this.onPointerDownPointerY) * 0.1 + this.onPointerDownLat;

        this.mouse2d.x = (event.touches[0].pageX / this.size.w) * 2 - 1;
        this.mouse2d.y = -(event.touches[0].pageY / this.size.h) * 2 + 1;

      }

    },

    onSceneClick: function(x, y) {
/*
      this.projectionVector.set(x, y, 0.5);
      this.projectionVector.unproject(this.camera);

      var dir = this.projectionVector.sub(this.camera.position).normalize();
      //var distance = -this.camera.position.y / dir.y;
      //var pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
      this.raycaster.set(this.camera.position, dir);

      var intersects = this.raycaster.intersectObjects([this.mesh]);
      if (intersects.length > 0) {

        //var normalizedPoint = intersects[0].point.clone().normalize();
        //var u = Math.atan2(normalizedPoint.x, normalizedPoint.z) / (2 * Math.PI) + 0.5;
        //var v = Math.asin(normalizedPoint.y) / Math.PI + 0.5;

        //this.plotIn3D(intersects[0].point);
        //this.plotOnTexture(intersects[0].point);
        //console.log('intersect: ' + intersects[0].point.x.toFixed(2) + ', ' + intersects[0].point.y.toFixed(2) + ', ' + intersects[0].point.z.toFixed(2) + ')');


        var point = intersects[0].point;
        var pointData = panoUtils.getPointData(this.imageDataLib.normal, this.imageDataLib.depth, point);


        var distanceToCamera = pointData.distance;
        var pointInWorld = point.normalize().multiplyScalar(distanceToCamera * 4);
        var normalInWorld = pointData.normal;

        //var up = new THREE.Vector3(0,-1,0);

        if (pointData.distance > 140 || pointData.distance < 5) {
          //return;
        }

        if (normalInWorld.y <= 1) {
          //create geo
          var newBrick = this.buildBrick.clone();
          //var mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1,1), new THREE.MeshLambertMaterial({color: 0xff0000}));
          //mesh.scale.set(0.4,0.4,0.4);
          //pointInWorld.x = Math.round(pointInWorld.x / 8.1) * 8.1;
          //pointInWorld.z = Math.round(pointInWorld.z / 8.1) * 8.1;
          pointInWorld.y = 0;//Math.round(pointInWorld.y / 1) * 1;

          panoUtils.plotOnTexture(this.mesh.material.uniforms.texture1.value, pointInWorld);

          newBrick.position.copy(pointInWorld);

          //newBrick.position.y = Math.max(-40,newBrick.position.y);

          this.plottedBricksContainer.add(newBrick);
        }
      }


      //var raycaster = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

      //test nav
      /*var intersects = raycaster.intersectObjects(this.nav.markers);
      if (intersects.length > 0) {
        this.emit('panoLinkClicked', intersects[0].object.pano,intersects[0].object.description);
        return;
      }

      intersects = raycaster.intersectObjects([this.mesh]);
      if (intersects.length > 0) {
        var normalizedPoint = intersects[0].point.clone().normalize();
        var u = Math.atan2(normalizedPoint.x, normalizedPoint.z) / (2 * Math.PI) + 0.5;
        var v = Math.asin(normalizedPoint.y) / Math.PI + 0.5;

        //this.plotIn3D(intersects[0].point);
        //this.plotOnTexture(intersects[0].point);
        //console.log('intersect: ' + intersects[0].point.x.toFixed(2) + ', ' + intersects[0].point.y.toFixed(2) + ', ' + intersects[0].point.z.toFixed(2) + ')');
      }
*/
    },

    render: function() {

      if (this.isRunning) {
        if (!this.blockInteractions) {
          this.rafId = raf(this.render);
        }
      } else {
        return;
      }

      this.renderer.autoClearColor = false;

      //this.testMouseOverObjects();

      this.renderer.clear(true, true, true);

      this.mesh.visible = false;

      this.camera.position.y = 20;

      this.backgroundContainer.traverse(this.setVisibleShown);
      this.plottedBricksContainer.traverse(this.setVisibleHidden);

      this.composer.render(this.scene, this.camera, false);

      this.mesh.visible = true;
      this.backgroundContainer.traverse(this.setVisibleHidden);
      this.plottedBricksContainer.traverse(this.setVisibleShown);

      this.composer.render(this.scene, this.camera, true);

      this.composer.pass(this.fxaaPass);
      this.composer.pass(this.vignettePass);
      this.composer.pass(this.noisePass);

      this.composer.toScreen();

      if (!this.blockInteractions) {
        this.lat = Math.max(-85, Math.min(85, this.lat));
        this.phi = (90 - this.lat) * Math.PI / 180;
        this.theta = this.lon * Math.PI / 180;

        this.updatedTarget.set(
          500 * Math.sin(this.phi) * Math.cos(this.theta),
          500 * Math.cos(this.phi),
          500 * Math.sin(this.phi) * Math.sin(this.theta)
        );

        this.target.lerp(this.updatedTarget, 1);

        this.camera.lookAt(this.target);
      }

      this.time += 0.01;
    },

    onTakePhoto: function() {

      var orgSize = {
        w: this.size.w,
        h: this.size.h
      };

      var w = 1024;
      var h = 512;

      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
      this.composer.reset();

      //this.render();
      this.render();

      var img = this.composer.renderer.domElement.toDataURL('image/jpeg');
      this.pub('share:imageCreated', img);

      this.camera.aspect = orgSize.w / orgSize.h;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(orgSize.w, orgSize.h);
      this.composer.setSize(orgSize.w, orgSize.h);
      this.composer.reset();

      this.render();

    },

    onShareOpen: function() {
      this.blockInteractions = true;
      this.removeEvents();
    },

    onShareClose: function() {
      this.blockInteractions = false;
      this.initEvents();
      this.render();
    },

    setVisibleHidden: function(child) {
      child.visible = false;
    },

    setVisibleShown: function(child) {
      child.visible = true;
    },

    onResize: function() {

      var w = window.innerWidth;
      var h = window.innerHeight;

      this.size.w = w;
      this.size.h = h;

      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
      this.composer.reset();

    },

    dispose: function() {

      this.isDestroyed = true;

      this.removeEvents();
      window.removeEventListener('resize', this.onResize);

    }

  }
};
