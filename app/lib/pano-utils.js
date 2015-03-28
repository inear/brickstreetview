'use strict';

var THREE = require('three');
var MAP_WIDTH = 512;
var MAP_HEIGHT = 256;

module.exports.plotOnTexture = function(normalTexture, point) {

  var normalizedPoint = point.clone().normalize();

  var u = 0.5 + Math.atan2(normalizedPoint.z, normalizedPoint.x) / (2 * Math.PI);
  var v = 0.5 - Math.asin(normalizedPoint.y) / Math.PI;

  //normal
  var canvas = normalTexture.image;
  var ctx = canvas.getContext('2d');
  //var data = ctx.getImageData(Math.floor(u * canvas.width), Math.floor(v * canvas.height), 1, 1);
  //var pixel = data.data;
  //var normal = new THREE.Vector3(pixel[0]/255-0.5,pixel[1]/255-0.5,pixel[2]/255-0.5);

  var x = Math.floor(u * MAP_WIDTH);
  var y = Math.floor(v * MAP_HEIGHT);

  ctx.fillRect(x, y, 1, 1);

  normalTexture.needsUpdate = true;

};

module.exports.getPointData = function(normalData, depthData, point) {
  var normalizedPoint = point.clone().normalize();

  var u = 0.5 + Math.atan2(normalizedPoint.z, normalizedPoint.x) / (2 * Math.PI);
  var v = 0.5 - Math.asin(normalizedPoint.y) / Math.PI;

  var x = Math.floor((1 - u) * MAP_WIDTH);
  var y = Math.floor(v * MAP_HEIGHT);

  var pixelIndex = y * MAP_WIDTH + x;

  var distance = depthData[pixelIndex];

  var normal = new THREE.Vector3(
    normalData[pixelIndex * 4],
    normalData[pixelIndex * 4 + 1],
    normalData[pixelIndex * 4 + 2]
  );

  return {
    distance: distance,
    normal: normal
  };
};
