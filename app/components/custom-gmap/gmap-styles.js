module.exports = [
  {'stylers': [
    {'visibility': 'off'}
  ]},
  {
    'featureType': 'landscape.man_made',
    'stylers': [
      {'visibility': 'on'},
      {'color': '#6D6E5C'},
      {'lightness': -75}
    ]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      {'visibility': 'simplified'},
      {color: '#6C6E68'}
    ]
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [
      //{color: '#6D6E5C'}
      {color: '#ff0000'}
    ]
  },
  {
    'featureType': 'landscape.man_made',
    'stylers': [
      {'visibility': 'simplified'}
    ]
  },
  {
    'featureType': 'road',
    'elementType': 'labels.text.fill',
    'stylers': [
      {'visibility': 'on'},
      {'color': '#FFF03A'}
    ]
  },
  {
    'featureType': 'road',
    'elementType': 'geometry.fill',
    'stylers': [
      {'visibility': 'on'},
      {'color': '#000000'},
      {'lightness': -200}
    ]
  },
  {
    'featureType': 'water',
    'elementType': 'geometry.fill',
    'stylers': [
      {'visibility': 'on'},
      {'color': '#4C61DB'},
      {'lightness': -50}
    ]
  },
  {
    'featureType': 'landscape.natural',
    'elementType': 'geometry.fill',
    'stylers': [
      {'visibility': 'on'},
      //{'color': '#ff6E5C'}
      {'color': '#6D6E5C'}
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [
      { "visibility": "on" },
      {'color': '#257A3E'},
      {'lightness': -50}
    ]
  }
];
