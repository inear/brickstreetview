'use strict';

var list = [
  {label: 'Stockholm', location: '59.331422,18.060866'},
  {label: 'New York', location: '40.749911,-73.981673'},
  {label: 'Paris', location: '48.858906,2.298322'},
  {label: 'Hong Kong', location: '22.296472,114.172036'},
  {label: 'Sydney', location: '-33.858626,151.210721'},
  {label: 'Washington DC', location: '38.895266,-77.042262'},
  {label: 'London', location: '51.499908,-0.121631'}
];

module.exports.getList = function() {
  return list;
};

module.exports.getRandomLocation = function() {
  var locString = list[Math.floor(Math.random() * list.length)].location;
  var cols = locString.split(',');
  return new google.maps.LatLng(cols[0], cols[1]);
};
