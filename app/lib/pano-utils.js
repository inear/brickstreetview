'use strict';

var THREE = require('three');
var MAP_WIDTH = 512;
var MAP_HEIGHT = 256;
var DEG_TO_RAD = Math.PI / 180;

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
  ctx.fillStyle = 'rgba(255,255,255,1)';
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

module.exports.get3DPointAtEdge = function(normalCtx, textureX, heightThreshold) {

  var data = normalCtx.getImageData(Math.floor(textureX), 0, 1, 255).data;
  var len = data.length;
  var dist;

  //ground
  var compareR = 128;
  var compareG = 0;
  var compareB = 126;

  //sky
  /*var compareR = 128;
  var compareG = 128;
  var compareB = 128;*/
  var rangeStartAt = null;
  var pixel = 0;
  var foundColor = false;
  var result;

  for (var py = len - 4; py > 0; py -= 4) {
    //test pixel
    pixel++;

    if (!foundColor) {

      dist = Math.abs(colorDistance(compareR, compareG, compareB, data[py], data[py + 1], data[py + 2]));

      if (dist > 58) {

        rangeStartAt = py;

        result = this.get3DPointFromUV((pixel) / MAP_HEIGHT, textureX / MAP_WIDTH);

        //check
        foundColor = true;

      }
    }
  }


  if (foundColor) {
    if (heightThreshold) {

      py = rangeStartAt - heightThreshold * 4;
      //test at threshold value

      dist = Math.abs(colorDistance(128, 128, 128, data[py], data[py + 1], data[py + 2]));

      if (dist !== 0) {
        return result;
      }
    } else {
      return result;
    }

  }

  function colorDistance(colorRed, colorGreen, colorBlue, pixelRed, pixelGreen, pixelBlue) {

    var diffR, diffG, diffB;

    // distance to color
    diffR = (colorRed - pixelRed);
    diffG = (colorGreen - pixelGreen);
    diffB = (colorBlue - pixelBlue);
    return (Math.sqrt(diffR * diffR + diffG * diffG + diffB * diffB));

  }
};

module.exports.get3DPointFromUV = function(u, v) {
  var lat = u * 180 - 90;
  var lon = v * 360 - 180;
  var r = Math.cos(DEG_TO_RAD * lat);

  //range between 0-1
  var pos = new THREE.Vector3();
  pos.x = (r * Math.cos(DEG_TO_RAD * lon));
  pos.y = (Math.sin(DEG_TO_RAD * lat));
  pos.z = (r * Math.sin(DEG_TO_RAD * lon));

  pos.normalize();

  return pos;
};
/*
module.exports.getEdgePoint = function(imageData) {

  var width  = imageData.width;
  var height = imageData.height;
  var data = imageData.data;

  var E = EDGE_DETECT_VALUE; // local copy

  var points = [];
  var x, y, row, col, sx, sy, step, sum, total;

  for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
          sum = total = 0;

          for (row = -1; row <= 1; row++) {
              sy = y + row;
              step = sy * width;
              if (sy >= 0 && sy < height) {
                  for (col = -1; col <= 1; col++) {
                      sx = x + col;

                      if (sx >= 0 && sx < width) {
                          sum += data[(sx + step) << 2];
                          total++;
                      }
                  }
              }
          }

          if (total) sum /= total;
          if (sum > E) points.push(new Array(x, y));
      }
  }

  return points;
}
*/



