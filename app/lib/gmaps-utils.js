'use strict';

var GoogleMapsLoader = require('google-maps');
var request = require('superagent');

var API_KEY = '';
var LIBRARIES = [];

var STREET_VIEW_API = 'https://maps.googleapis.com/maps/api/streetview?';

var toString = Object.prototype.toString;
function isFunction(fn) {
  return toString.call(fn).toLowerCase() == '[object function]';
}

/*
  Google Maps API utils
  - configure(opts) configure api key and libraries
  - load(cb) async load the API
  - getFitZoom(bounds, mapDom) calculate a zoom level to fit an object on the screen
  - parseKML(map, url, cb) retrieve a KML file, parse it and append it to the map
 */

var gmapsUtils = module.exports;

module.exports.configure = function(opts) {
  API_KEY = opts.key;
  LIBRARIES = opts.libraries;

  GoogleMapsLoader.KEY = API_KEY;
  GoogleMapsLoader.LIBRARIES = LIBRARIES;
};

/*==========
  API async loading
  ========== */

/**
 * Load the Google Maps API
 * @param  {Function} cb Callback
 */
module.exports.load = function(cb) {
  GoogleMapsLoader.load(function() {
    if (cb) cb();
    cb = null;
  });
};

/**
 * Called only once after the first loading. Extends some methods of google.maps
 */
GoogleMapsLoader.onLoad(function() {
  //require('projected-overlay')();
  //require('polygon-getbounds')();
});


/* =========
  KML Parsing
 ========= */

module.exports.parseKML = function(url, map, onSuccess, onError) {
  var kmlParser = new geoXML.parser({
    map: map,
    zoom: false,
    afterParse: onSuccess,
    suppressInfoWindows: true
  });

  request.get(url, function(result) {
    if(result.clientError) {
      kmlParser = null;
      return onError(result.error);
    }
    kmlParser.parseKmlString('<kml>' + result.text + '</kml>');
    kmlParser = null;
  });
};

/* =========
  Geolocation
 ========= */
/*
module.exports.locate = function(onSuccess, onError, useIPFallback) {
  geolocator.locate(onSuccess, onError, useIPFallback, {
    enableHighAccuracy: false, // if true, can throw an error so...
    timeout: 6000, // fails if it takes longer than 6s
    maximumAge: 60000 // allow to use cached position up to 1mn ago
  });
};*/

/* =========
  Street view
 ========= */

module.exports.getStaticStreetView = function(params) {

  // allows to use LatLng object or just plain coordinates
  var lat = params.position.lat;
  var lng = params.position.lng;
  lat = isFunction(lat) ? params.position.lat() : lat;
  lng = isFunction(lng) ? params.position.lng() : lng;

  var queryString = [
    'size=' + params.imageWidth + 'x' + params.imageHeight,
    'location=' + lat + ',' + lng,
    'heading=' + params.pov.heading,
    'pitch=' + params.pov.pitch,
    'fov=' + params.fov,
    'key=' + GoogleMapsLoader.KEY
  ].join('&');

  return STREET_VIEW_API + queryString;
};

module.exports.getPanorama = function(position, onError, onSuccess) {
  var smallRadius = 50;
  var expandedRadius = 500;
  var searchRadius = smallRadius;
  var pos;

  var sv = new google.maps.StreetViewService();

  function getPano() {
    sv.getPanoramaByLocation(pos, searchRadius, onPano);
  }

  /*
    On error: try to expand the radius
    if it was already expanded, return error
   */
  function onPano(panorama, status) {
    if (status !== google.maps.StreetViewStatus.OK) {
      if(searchRadius === expandedRadius) {
        return onError();
      }

      searchRadius = expandedRadius;
      getPano();
    }

    return onSuccess(panorama);
  }

  this.getAccurateStreetView(position, onError, function(accuratePosition) {
    pos = accuratePosition;
    getPano();
  });
};

module.exports.getAccurateStreetView = function(position, onError, onSuccess) {
  var ds = new google.maps.DirectionsService();
  ds.route({
    origin: position,
    destination: position,
    travelMode: google.maps.TravelMode.DRIVING
  }, function(result, status) {
    if(status !== 'OK') return onError();

    onSuccess(result.routes[0].legs[0].start_location);
  });
};

