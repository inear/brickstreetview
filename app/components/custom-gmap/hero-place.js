'use strict';

module.exports = HeroPlace;

var THREE = require('three');

function HeroPlace(map, builder, scene, camera) {
  this.map = map;
  this.builder = builder;
  this.scene = scene;
  this.camera = camera;
  this.size = {w: window.innerWidth, h: window.innerHeight};
  this.projectionVector = new THREE.Vector3();

  this.scaleMap = {
    13: 0.5,
    14: 0.6,
    15: 0.7,
    16: 0.8,
    17: 0.9,
    18: 1,
    19: 1,
    20: 1,
    21: 1,
    22: 1,
    23: 1,
    24: 1
  };

  this.list = [
    {
      id: 'eiffel_tower',
      model: 'eiffel_tower.mpd',
      scale: 0.4,
      rotation: new THREE.Euler(0, Math.PI * -0.25, 0),
      radius: 1000,
      optimized:true,
      latLng: new google.maps.LatLng(48.858469, 2.294438)
    },
    {
      id: 'empirestate',
      model: 'empirestatebuilding.ldr',
      scale: 0.6,
      optimized:true,
      rotation: new THREE.Euler(0, Math.PI * -0.34, 0),
      radius: 1000,
      latLng: new google.maps.LatLng(40.74844, -73.985578)
    },
    {
      id: 'operahouse',
      model: 'operahouse.ldr',
      scale: 0.4,
      optimized:true,
      rotation: new THREE.Euler(0, Math.PI * 0.10, 0),
      radius: 1000,
      latLng: new google.maps.LatLng(-33.8559,151.216557)
    },
    {
      id: 'whitehouse',
      model: 'whitehouse.ldr',
      scale: 0.4,
      optimized: true,
      rotation: new THREE.Euler(0, Math.PI*0.5, 0),
      radius: 1000,
      latLng: new google.maps.LatLng(38.898038,-77.035739)
    }
  ];

  this.currentPlace = null;

  this.meshContainer = new THREE.Object3D();
  this.meshContainer.rotation.x = Math.PI;
  this.scene.add(this.meshContainer);
}

var p = HeroPlace.prototype;

p.checkLocation = function() {
  var item;
  for (var i = this.list.length - 1; i >= 0; i--) {
    item = this.list[i];
    var dist = google.maps.geometry.spherical.computeDistanceBetween(this.map.getCenter(), item.latLng);

    if (dist < item.radius) {
      this.setPlace(item);
    }
  }
};

p.setPlace = function(item) {
  if (this.currentPlace && this.currentPlace.id === item.id) {
    return;
  }

  if (this.currentPlace) {
    this.meshContainer.remove(this.currentPlace.mesh);
    this.currentPlace.mesh.geometry.dispose();
    this.currentPlace = null;
  }


  //load model
  this.builder.loadModelByName(item.model, {
      drawLines: false,
      optimized: item.optimized
    }, function(mesh) {

      this.currentPlace = item;
      mesh.scale.set(item.scale, item.scale, item.scale);
      mesh.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
      this.currentPlace.mesh = mesh;

      this.meshContainer.add(mesh);


    }.bind(this));
};

p.setSize = function(w, h) {
  this.size.w = w;
  this.size.h = h;
};

p.update = function(proj) {
  if (this.currentPlace) {

    var point = proj.fromLatLngToContainerPixel(this.currentPlace.latLng);
    this.projectionVector.set((point.x - this.size.w * 0.5) / this.size.w * 2, (point.y - this.size.h * 0.5) / -this.size.h * 2, -0.5);
    this.projectionVector.unproject(this.camera);

    var dir = this.projectionVector.sub(this.camera.position).normalize();
    var distance = -this.camera.position.y / dir.y;
    var pos = this.camera.position.clone().add(dir.multiplyScalar(distance));

    this.meshContainer.position.x = pos.x;
    this.meshContainer.position.z = pos.z;

    var scale = this.scaleMap[this.map.getZoom()];
    scale = Math.pow(scale, 4);
    this.currentPlace.mesh.scale.set(scale, scale, scale);

  }
};
