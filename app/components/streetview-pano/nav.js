'use strict';

module.exports = Nav;

var THREE = require('three');


function Nav() {

  this.container = new THREE.Object3D();
  this.container.position.y = 0;
  this.markers = [];

  for (var i = 0; i < 6; i++) {
    var newMarker = new THREE.Object3D();
    this.markers.push(newMarker);
  }
}

var p = Nav.prototype;

p.addRoad = function(index, mesh) {
  this.markers[index].add(mesh);
};

p.addCrossRoad = function(mesh) {
  this.crossRoad = mesh;
};

p.createArrows = function() {

  // create a basic shape
  /*
    var tex = THREE.ImageUtils.loadTexture( imageFolder + 'ground_128.jpg' );
    tex.repeat.x = tex.repeat.y = 0.1;

    markerGeo = new THREE.SphereGeometry(2,6,6);
    markerGeo.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,55));

    var marker = new THREE.Mesh( markerGeo, new THREE.MeshBasicMaterial({color:0xff0000,visible:false}));

    for (var i = 0; i < 4; i++) {
      var newMarker = marker.clone();
      this.markers.push(newMarker);
    };
  */
};

p.setLinks = function(links, centerHeading) {

  this.links = links;

  if( this.links.length > 0) {
    this.container.add(this.crossRoad);
  }
  else {
    this.container.remove(this.crossRoad);
  }

  for (var i = 0; i < 4; i++) {
    if (this.markers[i].parent) {
      this.container.remove(this.markers[i]);
      this.markers[i].active = false;
    }
  }

  for (i = links.length - 1; i >= 0; i--) {

    this.markers[i].rotation.y = ((links[i].heading - 90 - centerHeading) * -1);

    this.markers[i].rotation.y = Math.round(this.markers[i].rotation.y / 90) * 90 * Math.PI / 180;

    this.markers[i].pano = links[i].pano;
    this.markers[i].description = links[i].description;
    this.markers[i].active = true;
    this.container.add(this.markers[i]);

  }
};

p.getMarkers = function() {
  return this.markers;
};
