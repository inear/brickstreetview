'use strict';

var GSVPANO = module.exports = GSVPANO || {};
var jsonp = require('jsonp');
var base64 = require('base-64');
var zpipe = require('zpipe');
//var deflate = require('deflate-js');

GSVPANO.PanoLoader = function (parameters) {

    'use strict';

    var _parameters = parameters || {},
        _location,
        _zoom,
        _panoId,
        _panoClient = new google.maps.StreetViewService(),
        _count = 0,
        _total = 0,
        _canvas = document.createElement('canvas'),
        _ctx = _canvas.getContext('2d'),
        rotation = 0,
        copyright = '',
        links=[],
        onSizeChange = null,
        onPanoramaLoad = null;

    this.setProgress = function (p) {

        if (this.onProgress) {
            this.onProgress(p);
        }

    };

    this.throwError = function (message) {

        if (this.onError) {
            this.onError(message);
        } else {
            console.error(message);
        }

    };

    this.adaptTextureToZoom = function () {

        var w = 416 * Math.pow(2, _zoom),
            h = (416 * Math.pow(2, _zoom - 1));
        _canvas.width = w;
        _canvas.height = h;
        _ctx.translate( _canvas.width, 0);
        _ctx.scale(-1, 1);
    };

    this.composeFromTile = function (x, y, texture) {

        _count++;

        _ctx.drawImage(texture, x * 512, y * 512);

        var p = Math.round(_count * 100 / _total);
        this.setProgress(p);

        if (_count === _total) {
            this.canvas = _canvas;
            if (this.onPanoramaLoad) {
                this.onPanoramaLoad();
            }
        }

    };
    this.savePixelated = function(texture) {
      var c=document.createElement('canvas')
      c.width = 512;
      c.height = 512;

      var size = 0.1;
      /// cache scaled width and height
      var w = c.width * size;
      var h = c.height * size;

      var ctx=c.getContext("2d");
      ctx.mozImageSmoothingEnabled = false;
      ctx.imageSmoothingEnabled = false;
      ctx.imageSmoothingEnabled = false;

      ctx.drawImage(texture,0,0,w, h);
      ctx.drawImage(c, 0, 0, w, h, 0, 0, c.width, c.height);

      texture.pixelated1 = c;
    }

    this.composePanorama = function () {

        this.setProgress(0);
        console.log('Loading panorama for zoom ' + _zoom + '...');

        var w = Math.pow(2, _zoom) - 1,
            h = Math.pow(2, _zoom - 1),
            self = this,
            url,
            x,
            y;


        _count = 0;
        _total = w * h;

        for( y = 0; y < h; y++) {
            for( x = 0; x < w; x++) {
                url = 'http://maps.google.com/cbk?mode=html5&output=tile&panoid=' + _panoId + '&zoom=' + _zoom + '&x=' + x + '&y=' + y + '&' + Date.now();
                (function (x, y) {

                    var img = new Image();
                    img.addEventListener('load', function () {
                      self.savePixelated(this);
                      self.composeFromTile(x, y, this);
                    });
                    img.addEventListener('error', function () {
                      console.log('error');
                      _count++;

                      if (_count === _total) {
                        self.canvas = _canvas;
                        if (self.onPanoramaLoad) {
                            self.onPanoramaLoad();
                        }
                      }

                    });
                    img.crossOrigin = "anonymous";

                    img.src = url;


                })(x, y);
            }
        }

    };

    this.loadId = function (id) {

      var self = this;
      _panoClient.getPanoramaById(id, function (result, status) {
          if (status === google.maps.StreetViewStatus.OK) {
              if( self.onPanoramaData ) self.onPanoramaData( result );

              //var h = google.maps.geometry.spherical.computeHeading(location, result.location.latLng);
              //rotation = (result.tiles.centerHeading - h) * Math.PI / 180.0;
              copyright = result.copyright;
              self.copyright = result.copyright;
              _panoId = result.location.pano;
              self.panoId = _panoId;
              self.location = location;
              self.links = result.links;
              self.centerHeading = result.tiles.centerHeading;
              self.panoLocation = result.location;
              console.log("links", result.links)
              self.composePanorama();
          } else {
              if( self.onNoPanoramaData ) self.onNoPanoramaData( status );
              self.throwError('Could not retrieve panorama for the following reason: ' + status);
          }
      });

    }

    this.load = function (location) {

        var self = this;
        _panoClient.getPanoramaByLocation(location, 50, function (result, status) {
            if (status === google.maps.StreetViewStatus.OK) {
                if( self.onPanoramaData ) self.onPanoramaData( result );

                //var h = google.maps.geometry.spherical.computeHeading(location, result.location.latLng);
                //rotation = (result.tiles.centerHeading - h) * Math.PI / 180.0;
                copyright = result.copyright;
                self.copyright = result.copyright;
                _panoId = result.location.pano;
                self.panoId = _panoId;
                self.location = location;
                self.links = result.links;
                self.centerHeading = result.tiles.centerHeading;
                self.panoLocation = result.location;
                self.composePanorama();

                console.log('load id: ' + _panoId);
            } else {
                if( self.onNoPanoramaData ) self.onNoPanoramaData( status );
                self.throwError('Could not retrieve panorama for the following reason: ' + status);
            }
        });



    };

    this.setZoom = function( z ) {
        _zoom = z;
        this.adaptTextureToZoom();
    };

    this.setZoom( _parameters.zoom || 1 );

};

GSVPANO.PanoDepthLoader = function(parameters) {

  'use strict';

  var _parameters = parameters || {},
    onDepthLoad = null;

  this.load = function(panoId) {
    var self = this,
      url;

    url = "http://maps.google.com/cbk?output=json&cb_client=maps_sv&v=4&dm=1&pm=1&ph=1&hl=en&panoid=" + panoId;

    jsonp(url,{},function(error,res){

      if( error && error.status) {

        console.error("Request failed: " + url + "\n" + error.status + "\n");

        if (self.onDepthError) {
          self.onDepthError();
          return;
        }

        return;
      }


      var decoded, buffers;

      try {
        decoded = self.decode(res.model.depth_map);
        buffers = self.parse(decoded);
      } catch (e) {
        console.error("Error loading depth map for pano " + panoId + "\n" + e.message + "\nAt " + e.filename + "(" + e.lineNumber + ")");
        //buffers = self.createEmptyDepthMap();
        if (self.onDepthError) {
          self.onDepthError();
          return;
        }
      }

      self.buffers = buffers;

      if (self.onDepthLoad) {
        self.onDepthLoad(buffers);
      }

    });

  }

  this.decode = function(rawDepthMap) {
    var self = this,
      i,
      compressedDepthMapData,
      depthMap,
      decompressedDepthMap;

    // Append '=' in order to make the length of the array a multiple of 4
    while (rawDepthMap.length % 4 != 0)
      rawDepthMap += '=';

    // Replace '-' by '+' and '_' by '/'
    rawDepthMap = rawDepthMap.replace(/-/g, '+');
    rawDepthMap = rawDepthMap.replace(/_/g, '/');

    // Decode and decompress data

    compressedDepthMapData = base64.decode(rawDepthMap);
    decompressedDepthMap = zpipe.inflate( compressedDepthMapData);

    // Convert output of decompressor to Uint8Array
    depthMap = new Uint8Array(decompressedDepthMap.length);
    for (i = 0; i < decompressedDepthMap.length; ++i)
      depthMap[i] = decompressedDepthMap.charCodeAt(i);

    return depthMap;
  }

  this.parseHeader = function(depthMap) {

    return {
      headerSize: depthMap.getUint8(0),
      numberOfPlanes: depthMap.getUint16(1, true),
      width: depthMap.getUint16(3, true),
      height: depthMap.getUint16(5, true),
      offset: depthMap.getUint16(7, true)
    };
  }

  this.parsePlanes = function(header, depthMap) {
    var planes = [],
      indices = [],
      i,
      n = [0, 0, 0],
      d,
      byteOffset;

      console.log(header)

    for (i = 0; i < header.width * header.height; ++i) {
      indices.push(depthMap.getUint8(header.offset + i));
    }

    for (i = 0; i < header.numberOfPlanes; ++i) {
      byteOffset = header.offset + header.width * header.height + i * 4 * 4;
      n[0] = depthMap.getFloat32(byteOffset, true);
      n[1] = depthMap.getFloat32(byteOffset + 4, true);
      n[2] = depthMap.getFloat32(byteOffset + 8, true);
      d = depthMap.getFloat32(byteOffset + 12, true);
      planes.push({
        n: n.slice(0),
        d: d
      });
    }

    return {
      planes: planes,
      indices: indices
    };
  }

  this.computeBuffers = function(header, indices, planes) {

    var depthMap = null,
      normalMap = null,
      normalPointer = 0,
      x, y,
      planeIdx,
      phi, theta,
      v = [0, 0, 0],
      w = header.width,
      h = header.height,
      plane, t, p;

    depthMap = new Float32Array(w * h);
    normalMap = new Float32Array(w * h * 3);

    for (y = 0; y < h; ++y) {
      for (x = 0; x < w; ++x) {
        planeIdx = indices[y * w + x];

        phi = (w - x - 1) / (w - 1) * 2 * Math.PI + Math.PI / 2;
        theta = (h - y - 1) / (h - 1) * Math.PI;

        v[0] = Math.sin(theta) * Math.cos(phi);
        v[1] = Math.sin(theta) * Math.sin(phi);
        v[2] = Math.cos(theta);

        if (planeIdx > 0) {
          plane = planes[planeIdx];

          t = plane.d / (v[0] * plane.n[0] + v[1] * plane.n[1] + v[2] * plane.n[2]);
          v[0] *= t;
          v[1] *= t;
          v[2] *= t;
          depthMap[y * w + (w - x - 1)] = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

          normalMap[normalPointer] = plane.n[1];
          normalMap[normalPointer + 1] = plane.n[2];
          normalMap[normalPointer + 2] = plane.n[0];

        } else {
          depthMap[y * w + (w - x - 1)] = 9999999999999999999.;

          normalMap[normalPointer] = 0;
          normalMap[normalPointer + 1] = 0;
          normalMap[normalPointer + 2] = 0;
        }

        normalPointer += 3;
      }
    }

    return {
      width: w,
      height: h,
      depthMap: depthMap,
      normalMap: normalMap
    };
  }

  this.parse = function(decodedDepthMap) {

    var depthMapData = new DataView(decodedDepthMap.buffer);
    var header = this.parseHeader(depthMapData);
    var data = this.parsePlanes(header, depthMapData);

    return this.computeBuffers(header, data.indices, data.planes);
  }

  this.createEmptyDepthMap = function() {
    var W = 512 * 2;
    var H = 256 * 2;

    var buffers = {
      width: W,
      height: H,
      depthMap: new Float32Array(W * H),
      normalMap: new Float32Array(W * H * 3)

    };

    for (var i = 0; i < W * H; ++i) {
      buffers.depthMap[i] = 9999999999999999999.;
    }

    for (var i = 0; i < W * H * 3; ++i) {
      buffers.normalMap[i] = 0;
    }
    return buffers;
  }
};
