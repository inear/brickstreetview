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
var Vue = require('vue');
var sv;

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
    //this.initLoader();
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
  },

  detached: function() {

    this.isRunning = false;
    if (this.rafId) {
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

    _.bindAll(this, 'onStartDragMinifig', 'onEndDragMinifig', 'onDragMinifig', 'drawStreetViewTileToCanvas', 'render', 'onZoomChanged', 'onResize');

    window.addEventListener('resize', this.onResize);

    sv = new google.maps.StreetViewService();

    var defaultLatlng = new google.maps.LatLng(40.759101, -73.984406);

    var myOptions = {
      zoom: 16,
      center: defaultLatlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      tilt: 45,
      disableDefaultUI: true,
      streetViewControl: false,
      styles: require('./styles'),
      scrollwheel: true
    };

    this.map = new google.maps.Map(this.gmapContainerEl, myOptions);

    google.maps.event.addListener(this.map, 'zoom_changed', this.onZoomChanged);

    this.streetviewCanvas = document.createElement('canvas');
    this.streetviewCanvas.width = 256;
    this.streetviewCanvas.height = 256;
    this.streetViewTileData = null;

    this.streetviewTileImg = document.createElement('img');
    this.streetviewTileImg.addEventListener('load', this.drawStreetViewTileToCanvas);

    //add pegs to google maps
    textureOverlay.init({
      el: document.querySelector('.CustomGMap-overlay'),
      map: this.map
    });

    this.mouse2d = new THREE.Vector2();
    this.frameTime = 0;
    this.size = {width: window.innerWidth, height: window.innerHeight};

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


  },

  methods: {

    onPreload: function() {

      Vue.nextTick(function() {
        //this.minifigDraggable = true;
        this.initCompleted = true;
        this.$dispatch('load-complete');
      }, this);
    },

    start: function() {
      this.isRunning = true;
      this.render();
    },

    onMouseMove: function(event) {
      this.mouse2d.x = (event.clientX / this.size.width) * 2 - 1;
      this.mouse2d.y = -(event.clientY / this.size.height) * 2 + 1;
    },

    render: function() {

      if (this.isRunning) {
        this.rafId = raf(this.render);
      }

      this.frameTime += 0.01;

      if (this.minifigDraggable) {

        this.minifigMesh.brigl.animatedMesh.head.rotation.y += (this.mouse2d.x * -1 - this.minifigMesh.brigl.animatedMesh.head.rotation.y) * 0.3;
        this.minifigMesh.brigl.animatedMesh.hair.rotation.y += (this.mouse2d.x * -1 - this.minifigMesh.brigl.animatedMesh.hair.rotation.y) * 0.1;

        this.minifigMesh.brigl.animatedMesh.armL.rotation.x = 0.6 + Math.sin(this.frameTime) * 0.3 - 0.15;


        /*
        TweenMax.to(mesh.brigl.animatedMesh.head.rotation, 0.2, {y: 0.3, ease: Sine.easeOut});
        TweenMax.to(mesh.brigl.animatedMesh.head.rotation, 0.5, {delay: 0.2, y: -0.6, ease: Back.easeOut});

        TweenMax.to(mesh.brigl.animatedMesh.hair.rotation, 0.2, {y: 0.3, ease: Sine.easeOut});

        TweenMax.to(mesh.brigl.animatedMesh.hair.rotation, 0.5, {delay: 0.2, y: -0.6, ease: Back.easeOut});

        TweenMax.to(mesh.brigl.animatedMesh.armL.rotation, 0.5, {x: 0.6, ease: Back.easeInOut});
        TweenMax.to(mesh.brigl.animatedMesh.armR.rotation, 0.5, {x: -0.6, ease: Back.easeInOut});

        TweenMax.to(mesh.brigl.animatedMesh.legL.rotation, 0.5, {x: 0.6, ease: Back.easeInOut});
        TweenMax.to(mesh.brigl.animatedMesh.legR.rotation, 0.5, {x: -0.6, ease: Back.easeInOut});
        */
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

      var light = new THREE.PointLight(0xffffff, 1);
      light.position.copy(this.camera.position);
      light.position.x = 250;
      light.position.y = 900;
      light.position.z = 250;

      this.scene.add(light);

      light = new THREE.DirectionalLight(0xaaaaaa, 0.8);
      light.position.set(100, 1000, 100);
      //this.scene.add(light);

      this.brickContainer = new THREE.Object3D();
      //this.brickContainer.rotation.z = Math.PI;
      this.scene.add(this.brickContainer);

      //this.scene.add( new THREE.Mesh(new THREE.SphereGeometry(50,10,10), new THREE.MeshBasicMaterial({color:0xff0000})));

    },

   /* initLoader: function() {
      var self = this;

       builder.loadModelByName('loading.ldr', {
        drawLines: false
      }, function(mesh) {

        var i = 0;
        Object.keys(mesh.brigl.animatedMesh).map(function(key) {

          i++;
          mesh.brigl.animatedMesh[key].initPos = mesh.brigl.animatedMesh[key].position.clone();
          mesh.brigl.animatedMesh[key].position.y += 20;
          mesh.brigl.animatedMesh[key].visible = false;

          TweenMax.from(mesh.brigl.animatedMesh[key].position, 1, {
            ease: Sine.easeOut,
            x: mesh.brigl.animatedMesh[key].position.x * 2,
            y: mesh.brigl.animatedMesh[key].initPos.y - (100 + Math.random() * 300),
            z: mesh.brigl.animatedMesh[key].position.z * 2,
            delay: (mesh.brigl.animatedMesh[key].initPos.x + 250) / 100 * 0.2,
            onStart: function(item) {
              item.visible = true;
            },
            onStartParams: [mesh.brigl.animatedMesh[key]],
            onComplete: function(item) {

              TweenMax.to(item.position, 0, {
                ease: Sine.easeIn,
                x: item.initPos.x,
                y: item.initPos.y,
                z: item.initPos.z
              });
           },
           onCompleteParams: [mesh.brigl.animatedMesh[key]]
          });

          TweenMax.from(mesh.brigl.animatedMesh[key].rotation, 0.5, {
            y: Math.PI * 1,
            z: Math.PI * 0.5,
            x: Math.PI * 0.2,
            ease: Sine.easeIn,
            delay: (mesh.brigl.animatedMesh[key].initPos.x + 250) / 100 * 0.2
          });
          //mesh.brigl.animatedMesh[key].initPos = mesh.brigl.animatedMesh[key].position.clone();
        });

        mesh.position.set(120, 600, 100);
        mesh.rotation.set(0, Math.PI * -0.5, Math.PI + 20 * Math.PI / 180);
        mesh.scale.set(0.2, 0.2, 0.2);
        self.scene.add(mesh);

      }, function(err) {
        console.log(err);
      });
    },
*/
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

      if (!this.isDragging) {
        this.circleContainer3D.position.x = -10000;
        return;
      }

      var children = this.circleContainer3D.children;
      var r, angle;
      for (var i = 0; i < 10; i++) {

        if (this.isOverRoad) {

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

      var pos = this.minifigPivot.position.clone();
      var dir = pos.clone().sub(this.camera.position).normalize();
      dir.multiplyScalar(500);
      this.circleContainer3D.position.copy(pos).add(dir);
    },


    initMinifig: function() {

      this.minifigDefaultPos = new THREE.Vector3(-26, 300, -32);

      this.minifigLocation = new google.maps.LatLng(0, 0);
      this.minifigIdleY = 600;
      this.minifigDragY = 0;

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

        //initPositions
        mesh.brigl.animatedMesh.legs.position.set(-60, 60, 0);
        mesh.brigl.animatedMesh.head.position.set(-60, -40, 0);
        mesh.brigl.animatedMesh.hair.position.set(20, -80, 0);

        mesh.brigl.animatedMesh.legs.rotation.z = 0.3;
        mesh.brigl.animatedMesh.head.rotation.z = 0.1;
        mesh.brigl.animatedMesh.hair.rotation.z = 0.7;


        setTimeout(function() {

          TweenMax.to(mesh.brigl.animatedMesh.legs.position, 0.4, {x: 0});
          TweenMax.to(mesh.brigl.animatedMesh.head.position, 0.4, {x: 0});
          TweenMax.to(mesh.brigl.animatedMesh.hair.position, 0.4, {x: 0});

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

                TweenMax.to(container.rotation, 0.5, {x: Math.PI * 0.2, ease: Sine.easeInOut});

                self.startHandHint();

                self.minifigDraggable = true;

              }
            });

            TweenMax.to(mesh.brigl.animatedMesh.hair.position, 0.2, {
              delay: 0.4,
              y: mesh.brigl.animatedMesh.hair.initPos.y
            });

          }, 200);
        }, 500);

      }, function(err) {
        console.log(err);
      });

    },

    startHandHint: function() {
      var tl = new TimelineMax({delay: 6, repeatDelay: 6, repeat: -1});
      tl.insert(TweenMax.to(this.minifigMesh.brigl.animatedMesh.armR.brigl.animatedMesh.handR.rotation, 0.3, {z: Math.PI * 0.3, yoyo: true, repeat: 1, repeatDelay: 0, ease: Sine.easeInOut}));
    },

    stopHandHint: function() {
      TweenMax.killTweensOf(this.minifigMesh.brigl.animatedMesh.armR.brigl.animatedMesh.handR.rotation);
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

      this.stopHandHint();
      this.minifigDraggable = false;
      this.isDragging = true;
      this.map.setOptions({ scrollwheel: false });

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
        x = offset.left + 30,
        y = offset.top + 30;


      this.updateMinifigModelPosition(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );

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
      //_panoLoader.load(this.minifigLocation);
      this.streetViewLayer.setMap();

      this.pub('loader:show');

      sv.getPanoramaByLocation(this.minifigLocation, 50, function(data, status) {
        if (status === google.maps.StreetViewStatus.OK) {
          /*
          position: data.location.latLng,

          title: data.location.description
          data.location.pano;*/
          console.log(data);

          self.gotoStreetView(data);

        } else {
          this.pub('loader:hide');
          self.backToIdle();
        }
      });
    },

    gotoStreetView: function(data) {

      var self = this;

      //this.gmapContainerWrapperEl.classList.add('tilted');
      this.minifigDraggingInstance.disable();

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
              //Vue.navigate('/streetview/' + data.location.pano);
            }
          });
        }
      });
    },

    backToIdle: function() {

      this.startHandHint();
      this.minifigDraggingInstance.enable();
      this.map.setOptions({ scrollwheel: true });
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
        x: Math.PI * -0.2,
        z: 0,
        y: 0
      });
      TweenMax.to(this.minifigPivot.position, 0.4, {
        x: this.minifigDefaultPos.x,
        z: this.minifigDefaultPos.z,
        y: this.minifigIdleY
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
