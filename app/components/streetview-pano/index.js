'use strict';

var _ = require('lodash');
var fs = require('fs');
var THREE = require('three');
var WAGNER = require('wagner');
var GSVPANO = require('gsvpano');
var raf = require('raf');
var BRIGL = require('brigl');
var parts = require('parts');
var TweenMax = require('tweenmax');
var TimelineMax = require('timelinemax');
var gmapsUtils = require('../../lib/gmaps-utils');
var canvasUtils = require('../../lib/canvas-utils');
var IMAGE_FOLDER = 'images/';
var Nav = require('./nav');
var builder = new BRIGL.Builder("parts/ldraw/", parts, {dontUseSubfolders:true} );

module.exports = {
  replace: true,
  template: fs.readFileSync(__dirname + '/template.html', 'utf8'),

  ready: function() {

    console.log('pano ready');

    this.threeEl = document.querySelector('.StreetviewPano-three');

    _.bindAll(this, 'render','onResize','onDepthLoad');

    this.isInitiated = true;

    this.size = {w:window.innerWidth,h:window.innerHeight};

    this.time = 0;
    this.isUserInteracting = false;
    this.isUserInteractingTime = 0;
    this.onMouseDownMouseX = 0;
    this.onMouseDownMouseY = 0;
    this.onMouseDownLon = 0;
    this.onMouseDownLat = 0;

    this.normalMapCanvas = null;
    this.depthData = null;

    this.mouse2d = new THREE.Vector2();

    this.lon = 90;
    this.lat = 0;
    this.phi = 0;
    this.theta = 0;
    this.updatedTarget = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.crossRoads = Object.create(null);
    this.fadeAmount = 0;
    this.isRunning = true;

    this.nav = new Nav(builder);

    this.init3D();
    this.initMaterials();
    this.initObjects();
    //this.loadLegoModels();
    this.onResize();
    this.render();

    gmapsUtils.load(this.onGoogleAPILoaded.bind(this));

  },

  attached: function(){

    window.addEventListener('resize',this.onResize);

    this.container = this.$el;
    this.isRunning = true;
    this.initEvents();

    if( this.isInitiated ) {
      this.render();
    }
  },

  detached: function(){
    this.isRunning = false;
    this.removeEvents();
  },

  methods: {
    onGoogleAPILoaded: function(){
      var self = this;
      this.defaultLatlng = new google.maps.LatLng(40.759101,-73.984406);

      this.panoLoader = new GSVPANO.PanoLoader({zoom: 3});
      this.depthLoader = new GSVPANO.PanoDepthLoader();

      this.panoLoader.onPanoramaLoad = function() {


        self.setPano(this.canvas);
        self.depthLoader.load(this.panoId);
        self.centerHeading = this.centerHeading;
        self.links = this.links;

        /*if( currentPanoLocation ) {
          var dist = google.maps.geometry.spherical.computeDistanceBetween(currentPanoLocation, this.panoLocation.latLng);

        }*/

        self.currentPanoLocation = this.panoLocation.latLng;

      }

      this.panoLoader.onNoPanoramaData = this.onNoPanoramaData;
      this.depthLoader.onDepthLoad = this.onDepthLoad;

      this.panoLoader.load(this.defaultLatlng);
    },


    onNoPanoramaData: function(){
      //pegmanTalk("Snakes! Can't go there. Try another spot",4);
      //backToMap();
    },

    onDepthError: function() {
      //pegmanTalk("Snakes! Can't go there. Try another spot",4);

      //backToMap();
    },

    onDepthLoad: function( buffers ) {
      var x, y, context, image, w, h, c,pointer;

      if( !this.depthCanvas ) {
        this.depthCanvas = document.createElement("canvas");
      }

      context = this.depthCanvas.getContext('2d');

      w = buffers.width;
      h = buffers.height;

      this.depthCanvas.setAttribute('width', w);
      this.depthCanvas.setAttribute('height', h);

      image = context.getImageData(0, 0, w, h);

      for(y=0; y<h; ++y) {
        for(x=0; x<w; ++x) {
          c = buffers.depthMap[y*w + x] / 50 * 255;
          image.data[4*(y*w + x)    ] = c;
          image.data[4*(y*w + x) + 1] = c;
          image.data[4*(y*w + x) + 2] = c;
          image.data[4*(y*w + x) + 3] = 255;
        }
      }

      context.putImageData(image, 0, 0);

      this.setDepthData(buffers.depthMap);
      this.setDepthMap(this.depthCanvas);

      if( !this.normalCanvas ) {
        this.normalCanvas = document.createElement("canvas");
        this.normalCanvas.style.position = 'absolute';
        this.normalCanvas.style.zIndex = 100;
        //document.body.appendChild(normalCanvas);
      }

      context = this.normalCanvas.getContext('2d');

      w = buffers.width;
      h = buffers.height;

      this.normalCanvas.setAttribute('width', w);
      this.normalCanvas.setAttribute('height', h);

      image = context.getImageData(0, 0, w, h);
      pointer = 0;

      var pixelIndex;

      for(y=0; y<h; ++y) {
        for(x=0; x<w; ++x) {
          pointer += 3;
          pixelIndex = (y*w + (w-x))*4;
          image.data[ pixelIndex ] = (buffers.normalMap[pointer]+1)/2 * 255;
          image.data[pixelIndex + 1] = (buffers.normalMap[pointer+1]+1)/2 * 255;
          image.data[pixelIndex + 2] = (buffers.normalMap[pointer+2]+1)/2 * 255;
          image.data[pixelIndex + 3] = 255;
        }
      }

      context.putImageData(image, 0, 0);

      this.setNormalData(buffers.normalMap);
      this.setNormalMap(this.normalCanvas);

      /*pano.generateNature();

      $streetview.removeClass('inactive');

      if( !pano.isIntro ) {
        TweenMax.to($loadingLabel,1,{opacity:0});
      }

      $loadingLabel.removeClass('inactive');
      TweenMax.to($loadingLabel,1,{opacity:1});

      //$map.fadeOut();
      $intro.fadeOut();
      TweenMax.to($loadingLabel,1,{opacity:0});



      loading = false;
      siteMode = 'streetview';
*/

      this.setLinks(this.links, this.centerHeading );


    },

    setDepthData: function( data ){
      this.depthData = data;
    },


    setNormalData: function( data ){
      this.normalData = data;
    },


    setPano: function( canvas ) {
      this.diffuseCanvas = canvas;
    },

    setNormalMap: function( canvas ) {
      this.normalMapCanvas = canvas;

      var normalContext = this.normalMapCanvas.getContext('2d');

      var diffuseW = this.diffuseCanvas.width;
      var diffuseH = this.diffuseCanvas.height;
      var diffuseContext = this.diffuseCanvas.getContext('2d');

      canvasUtils.renderClosePixels( diffuseContext, normalContext, [{ shape:"brick", resolutionX : 8, resolutionY : 18 ,offset:[0,0]}],diffuseW,diffuseH );

      this.mesh.material.uniforms.texture0.value.image = this.diffuseCanvas;
      this.mesh.material.uniforms.texture0.value.needsUpdate = true;

      this.mesh.material.uniforms.texture1.value.image = this.normalMapCanvas;
      this.mesh.material.uniforms.texture1.value.needsUpdate = true;

      //this.loadModels();
    },


    setDepthMap: function( canvas ) {
      this.mesh.material.uniforms.texture2.value.image = canvas;
      this.mesh.material.uniforms.texture2.value.needsUpdate = true;
    },

    init3D: function(){


      this.projectionVector = new THREE.Vector3();

      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.Fog(0x024b7d,800,3000);

      this.camera = new THREE.PerspectiveCamera(70, this.size.w/this.size.h, 1, 3100 );

      this.renderer = new THREE.WebGLRenderer({alpha:true});
      this.renderer.autoClear = false;
      this.renderer.autoClearColor = false;
      this.renderer.setClearColor(0x4c8b56,0);
      this.renderer.setSize( this.size.w,this.size.h );
      this.renderer.sortObjects = false;
      this.gammaInput = true;
      this.gammaOutput = true;

      //post effects
      this.composer = new WAGNER.Composer( this.renderer );
      this.blurPass = new WAGNER.FullBoxBlurPass();
      this.noisePass = new WAGNER.NoisePass();
      this.noisePass.params.amount = 0.05;
      this.fxaaPass = new WAGNER.FXAAPass();
      this.vignettePass = new WAGNER.VignettePass();
      this.vignettePass.params.amount = 0.5;

      //lights
      this.light = new THREE.DirectionalLight(0xffffff,0.6);
      this.light.position.z = 50;
      this.light.position.y = 100;
      this.scene.add(this.light);
      this.scene.add( new THREE.AmbientLight(0x111111,0.1));

      var pointLight = new THREE.PointLight( 0xffffff, 0.2, 2700 );
      pointLight.position.set(-50,50,0);
      this.scene.add( pointLight );

      var pointLight = new THREE.PointLight( 0xffffff, 0.3 );
      pointLight.position.set(1320,1030,60);
      this.scene.add( pointLight );

      //this.scene.add( new THREE.Mesh(new THREE.SphereGeometry(50,10,10), new THREE.MeshBasicMaterial({color:0xff0000})));

      this.threeEl.appendChild( this.renderer.domElement );

    },

    initMaterials: function(){

      THREE.ImageUtils.crossOrigin = "anonymous";

      var groundMaskUniforms = {
        texture0: { type: "t", value: new THREE.Texture() },
        texture1: { type: "t", value: new THREE.Texture() },
        texture2: { type: "t", value: new THREE.Texture() }
      };

      var params = {
        uniforms:  groundMaskUniforms,
        vertexShader: require('./streetview_vs.glsl'),
        fragmentShader: require('./streetview_fs.glsl'),
        side: THREE.DoubleSide,
        transparent:true,
        lights: false
      }

      this.maskMaterial = new THREE.ShaderMaterial(params);

      var groundTile = THREE.ImageUtils.loadTexture( IMAGE_FOLDER + 'ground_darkgrey_128.jpg' );
      groundTile.repeat.set(140,140);
      groundTile.wrapS = groundTile.wrapT = THREE.RepeatWrapping;
      groundTile.needsUpdate = true;

      var skyTile = THREE.ImageUtils.loadTexture( IMAGE_FOLDER + 'sky_128.jpg' );
      skyTile.repeat.set(25,25);
      skyTile.wrapS = skyTile.wrapT = THREE.RepeatWrapping;
      skyTile.needsUpdate = true;

      var wallTile = THREE.ImageUtils.loadTexture( IMAGE_FOLDER + 'sky_128.jpg' );
      wallTile.repeat.set(25,17);
      wallTile.wrapS = wallTile.wrapT = THREE.RepeatWrapping;
      wallTile.needsUpdate = true;

      this.boxMaterial = new THREE.MeshFaceMaterial([
        new THREE.MeshBasicMaterial({map:wallTile, color:0xffffff, specular:0xffffff, ambient:0x444444, side:THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({map:wallTile, color:0xffffff, specular:0xffffff, ambient:0x444444, side:THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({map:skyTile, color:0xffffff, specular:0xffffff, ambient:0x444444, side:THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({map:groundTile, color:0xffffff, specular:0xffffff, ambient:0x444444, side:THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({map:wallTile, color:0xffffff, specular:0xffffff, ambient:0x444444, side:THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({map:wallTile, color:0xffffff, specular:0xffffff, ambient:0x444444, side:THREE.DoubleSide })
        ]
      );
    },

    initObjects: function(){
      var self = this;

      this.mesh = new THREE.Mesh(
        new THREE.SphereGeometry( 1000, 80, 40,0, Math.PI*2,Math.PI*0.1, Math.PI*0.65 ),
        this.maskMaterial
      );
      this.scene.add( this.mesh );

      this.mesh.scale.x = -1;
      this.mesh.position.y = -250;

      this.roads = new THREE.Object3D();
      this.scene.add(this.nav.container);
      this.scene.add(this.roads);


      var skyGeo = new THREE.BoxGeometry(3000,2000,3000,1,1,1);
      this.sky = new THREE.Mesh( skyGeo, this.boxMaterial);
      this.sky.position.y = 1000-20;

      this.roads.add(this.sky);

      this.target = new THREE.Vector3();
      this.camera.lookAt(this.target);


    },


    loadLegoModels: function(){

      var self = this;
      var mesh;

      var urls = [
        {
          url:'models/sun.ldr',
          callback: function(mesh) {

            mesh.rotation.set(0,0,Math.PI*-0.5);
            mesh.scale.set(1.1,1.1,1.1);
            mesh.position.set(1420,1030,60);
            self.scene.add(mesh);

          }
        },

        {
          url:'models/spaceship.ldr',
          callback: function(mesh) {

            mesh.rotation.set(0,0,Math.PI*1.2)
            mesh.scale.set(0.40,0.40,0.40);
            mesh.position.set(130,70,120);
            self.scene.add(mesh);
          }
        },

        {
          url:'models/coolcar.mpd',
          callback: function(mesh) {

            mesh.rotation.set(0,Math.PI*0.5,Math.PI)
            mesh.scale.set(0.10,0.10,0.10);
            mesh.position.set(80,-16,-20);
            self.scene.add(mesh);
          }
        }

      ];

      var names = [
        //tree
        {
          name:'3470.dat',
          color:2,
          callback: function(mesh) {

            var newMesh;
            for (var i = 0; i < 5; i++) {
              for (var j = 0; j < 2; j++) {
                newMesh = mesh.clone();
                newMesh.rotation.set(0,0,Math.PI)
                newMesh.scale.set(0.20,0.20,0.20);
                newMesh.position.set(i*100-200,-19,80*((j===0)?-1:1));
                self.scene.add(newMesh);
              };
            }
          }
        },
        {
          name:'44343p01.dat',
          callback: function(mesh) {
            mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,-1).normalize(), Math.PI);
            mesh.scale.set(0.20,0.20,0.20);
            mesh.position.set(0,-20,0);
            self.scene.add(mesh);

          }
        }
      ];

      function loadNextUrl() {

        if( urls.length === 0) {
          loadNextName();
          return;
        }

        var item = urls.splice(0,1)[0];

        builder.loadModelByUrl(item.url, {drawLines: false,  startColor: item.color}, function(mesh){
          item.callback(mesh);
          loadNextUrl();
        }, function(err){
          console.log(err);
          loadNextUrl();
        });
      }

      function loadNextName() {

        if( names.length === 0) {
          allLoadingDone();
          return;
        }

        var item = names.splice(0,1)[0];

        builder.loadModelByName(item.name, {drawLines: false, startColor: item.color},  function(mesh){
          item.callback(mesh);
          loadNextName();
        }, function(err){
          console.log(err);
          loadNextName();
        });
      }

      function allLoadingDone() {
        console.log('all loading done');
      }

      loadNextUrl();


    },

    setLinks: function( links, centerHeading ){
      this.nav.setLinks(links, centerHeading);
    },

    initEvents: function(){
      //$(this.renderer.domElement).on('click', this.onSceneClick);

      this.onContainerMouseDown = this.onContainerMouseDown.bind(this);
      this.onContainerMouseMove = this.onContainerMouseMove.bind(this);
      this.onContainerMouseUp = this.onContainerMouseUp.bind(this);
      this.onContainerMouseWheel = this.onContainerMouseWheel.bind(this);

      this.onContainerTouchStart = this.onContainerTouchStart.bind(this);
      this.onContainerTouchEnd = this.onContainerTouchEnd.bind(this);
      this.onContainerTouchMove = this.onContainerTouchMove.bind(this);

      this.container.addEventListener( 'mousedown', this.onContainerMouseDown, false );
      this.container.addEventListener( 'mousemove', this.onContainerMouseMove, false );
      this.container.addEventListener( 'mouseup', this.onContainerMouseUp, false );
      this.container.addEventListener( 'mousewheel', this.onContainerMouseWheel, false );

      this.container.addEventListener( 'touchstart', this.onContainerTouchStart, false );
      this.container.addEventListener( 'touchend', this.onContainerTouchEnd, false );
      //this.container.addEventListener( 'touchcancel', this.onContainerTouchEnd, false );
      this.container.addEventListener( 'touchmove', this.onContainerTouchMove, false );
    },

    removeEvents: function(){
      this.container.removeEventListener( 'mousedown', this.onContainerMouseDown );
      this.container.removeEventListener( 'mousemove', this.onContainerMouseMove );
      this.container.removeEventListener( 'mouseup', this.onContainerMouseUp );
      this.container.removeEventListener( 'mousewheel', this.onContainerMouseWheel );

      this.container.removeEventListener( 'touchstart', this.onContainerTouchStart );
      this.container.removeEventListener( 'touchend', this.onContainerTouchEnd );
      //this.container.removeEventListener( 'touchcancel', this.onContainerTouchEnd );
      this.container.removeEventListener( 'touchmove', this.onContainerTouchMove );
    },


    onContainerMouseDown: function( event ) {

      event.preventDefault();

      this.isUserInteracting = true;
      this.isUserInteractingTime = Date.now();

      this.onPointerDownPointerX = event.clientX;
      this.onPointerDownPointerY = event.clientY;

      this.onPointerDownLon = this.lon;
      this.onPointerDownLat = this.lat;

      this.mouse2d.x = ( event.clientX / this.size.width ) * 2 - 1;
      this.mouse2d.y = - ( event.clientY / this.size.height ) * 2 + 1;

      //$('body').removeClass('grab').addClass('grabbing');

    },

    onContainerMouseMove: function( event ) {

      event.preventDefault();

      if ( this.isUserInteracting ) {

        this.lon = ( this.onPointerDownPointerX - event.clientX ) * 0.1 + this.onPointerDownLon;
        this.lat = ( event.clientY - this.onPointerDownPointerY ) * 0.1 + this.onPointerDownLat;

      }

      this.mouse2d.x = ( event.clientX / this.size.width ) * 2 - 1;
      this.mouse2d.y = - ( event.clientY / this.size.height ) * 2 + 1;
    /*
      delta = Date.now()-lastTime;
      lastTime = Date.now();
      $('#debug').text( delta );
    */
    },

    onContainerMouseUp: function( event ) {
      this.isUserInteracting = false;

      if( Date.now()- this.isUserInteractingTime < 300 ) {
        this.onSceneClick(this.mouse2d.x,this.mouse2d.y);
      }

      //$('body').removeClass('grabbing').addClass('grab');

    },

    onContainerMouseWheel: function( event ) {
      this.camera.fov -= event.wheelDeltaY * 0.05;

      this.camera.fov = Math.min(80,Math.max(40,this.camera.fov));
      this.camera.updateProjectionMatrix();
    },

    onContainerTouchStart: function( event ) {

      if ( event.touches.length == 1 ) {

        event.preventDefault();

        this.isUserInteractingTime = Date.now();
        this.isUserInteracting = true;

        this.onPointerDownPointerX = event.touches[ 0 ].pageX;
        this.onPointerDownPointerY = event.touches[ 0 ].pageY;

        this.mouse2d.x = ( event.touches[0].pageX / this.size.width ) * 2 - 1;
        this.mouse2d.y = - ( event.touches[0].pageY / this.size.height ) * 2 + 1;

        this.onPointerDownLon = this.lon;
        this.onPointerDownLat = this.lat;

      }

    },

    onContainerTouchEnd: function( event ){

      //event.preventDefault();

      this.isUserInteracting = false;

      if( Date.now()- this.isUserInteractingTime  < 300 ) {
        this.onSceneClick(this.mouse2d.x,this.mouse2d.y);
      }
    },

    onContainerTouchMove: function( event ) {

      if ( event.touches.length == 1 ) {

        event.preventDefault();

        this.lon = ( this.onPointerDownPointerX - event.touches[0].pageX ) * 0.1 + this.onPointerDownLon;
        this.lat = ( event.touches[0].pageY - this.onPointerDownPointerY ) * 0.1 + this.onPointerDownLat;

        this.mouse2d.x = ( event.touches[0].pageX / this.size.width ) * 2 - 1;
        this.mouse2d.y = - ( event.touches[0].pageY / this.size.height ) * 2 + 1;

      }

    },

    onSceneClick: function(x,y){

      var vector = new THREE.Vector3(x, y, 0.5);
      var projector = new THREE.Projector();
      projector.unprojectVector(vector, this.camera);

      var raycaster = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

    //test nav
      /*var intersects = raycaster.intersectObjects(this.nav.markers);
      if (intersects.length > 0) {
        this.emit('panoLinkClicked', intersects[0].object.pano,intersects[0].object.description );
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


    render: function(){

      if( this.isRunning ) {

        /*if(this.rafId) {
          raf.cancel( this.rafId);
        }
    */
        this.rafId = raf(this.render);
      }

      this.renderer.autoClearColor = false;

      //this.testMouseOverObjects();


      this.renderer.clear(true,true,true);

      this.mesh.visible = false;

      this.roads.traverse( this.setVisibleShown );

      this.composer.render( this.scene, this.camera, false );
      this.composer.reset();
      this.renderer.clear(false, true, false );


      this.mesh.visible = true;
      this.roads.traverse( this.setVisibleHidden );

      this.composer.render( this.scene, this.camera, false  );

      if( this.fadeAmount ) {
        this.composer.pass( this.blurPass, null, this.fadeAmount*50 );
      }

      this.composer.pass( this.fxaaPass );
      this.composer.pass( this.noisePass );
      this.composer.pass( this.vignettePass );

      this.composer.toScreen();

      //this.renderer.render(this.scene, this.camera);

      //this.lon += 1;

      this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
      this.phi = ( 90 - this.lat ) * Math.PI / 180;
      this.theta = this.lon * Math.PI / 180;

      this.updatedTarget.set(
        500 * Math.sin( this.phi ) * Math.cos( this.theta ),
        500 * Math.cos( this.phi ),
        500 * Math.sin( this.phi ) * Math.sin( this.theta )
      )

      this.target.lerp(this.updatedTarget,1);

      //this.target.x += Math.cos(this.time*2)*10;
      //this.target.y += Math.cos(this.time*2)*10;

      this.camera.lookAt( this.target );

      this.time += 0.01;
    },

    setVisibleHidden: function(child){
      child.visible = false;
    },

    setVisibleShown: function(child){
      child.visible = true;
    },

    onResize: function( ){

      var w = window.innerWidth;
      var h = window.innerHeight;

      this.size.w = w;
      this.size.h = h;

      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize( w, h );
      this.composer.setSize( w, h );
      this.composer.reset();

    },

    dispose: function(){

      this.isDestroyed = true;

      this.removeEvents();
      window.removeEventListener('resize',this.onResize);

    }

  }
};
