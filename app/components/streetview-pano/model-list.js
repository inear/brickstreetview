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
          newMesh.scale.set(0.15, 0.15, 0.15);
          newMesh.position.set(0, 0, 128/0.2*0.15 + i * 128/0.2*0.15);
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
      mesh.scale.set(0.15, 0.15, 0.15);
      mesh.position.set(0, 0, 0);
      self.nav.addCrossRoad(mesh);
    }
  },

  //brick 2x2
  {
    name: '3003.dat',
    callback: function(self, mesh) {
      mesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, -15, 0));
      mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, -1).normalize(), Math.PI);
      mesh.scale.set(0.2, 0.2, 0.2);
      mesh.position.set(0, 0, 0);
      self.buildBrick = mesh;
    }
  },

  //flower
  {
    name: '3741ac02.dat',
    color:14,
    callback: function(self, mesh) {
      //mesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, -15, 0));
      //mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, -1).normalize(), Math.PI);
      mesh.scale.set(0.2, 0.2, 0.2);
      mesh.position.set(0, 0, 0);
      self.flowerBrick = mesh;
    }
  }
];
