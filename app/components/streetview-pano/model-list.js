'use strict';

var THREE = require('three');

module.exports = [
  {
    name: 'sun.ldr',
    callback: function(self, mesh) {

      mesh.rotation.set(0, 0, Math.PI * -0.5);
      mesh.scale.set(1.1, 1.1, 1.1);
      mesh.position.set(1420, 1030, 60);
      self.scene.add(mesh);

    }
  },

  //road plates
  {
    name: '44336p01.dat',
    callback: function(self, mesh) {
      for (var j = 0; j < 4; j++) {
        for (var i = 0; i < 6; i++) {

          var newMesh = mesh.clone();
          newMesh.rotation.set(0, 0, Math.PI);

          newMesh.scale.set(0.2, 0.2, 0.2);
          newMesh.position.set(0, 0, 128 + i * 128);
          self.nav.addRoad(j, newMesh);
        }
      }

    }
  },

  //crossroad
  {
    name: '44343p01.dat',
    callback: function(self, mesh) {
      mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, -1).normalize(), Math.PI);
      mesh.scale.set(0.20, 0.20, 0.20);
      mesh.position.set(0, 0, 0);
      self.nav.addCrossRoad(mesh);
    }
  },

  //crossroad
  {
    name: '3003.dat',
    callback: function(self, mesh) {
      mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, -1).normalize(), Math.PI);
      mesh.scale.set(0.04, 0.04, 0.04);
      mesh.position.set(0, 0, 0);
      self.buildBrick = mesh;
    }
  }
];
