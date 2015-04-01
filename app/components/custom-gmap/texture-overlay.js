'use strict';

var _ = require('lodash');

function TextureOverlay() {
  this.isDragging = false;
  this.mousePositionStart = {x: 0, y: 0};

  this.mousePosition = {x: 0, y: 0};
  this.currentOffset = {x: 0, y: 0};

  this.mapOffsetStart = {x: 0, y: 0};
  this.mapOffset = {x: 0, y: 0};
}

TextureOverlay.prototype.constructor = TextureOverlay;

TextureOverlay.prototype.init = function(params) {
  this.el = params.el;
  this.map = params.map;

  _.bindAll(this,
    'onMapDrag',
    'onMapDragStart',
    'onMapDragEnd',
    'onZoomChanged',
    'onMouseMove'
  );

  this.addListeners();
  this.onZoomChanged();
};


TextureOverlay.prototype.onMapDragStart = function() {

  this.isDragging = true;
  this.mapOffsetStart.x = this.mapOffset.x;
  this.mapOffsetStart.y = this.mapOffset.y;

  this.mousePositionStart.x = this.mousePosition.x;
  this.mousePositionStart.y = this.mousePosition.y;

};

TextureOverlay.prototype.onMapDragEnd = function() {
  this.isDragging = false;
};

TextureOverlay.prototype.onZoomChanged = function() {

  var size = (this.map.zoom - 15) / 2 * 130;
  size = Math.max(40, size);
  this.el.style.backgroundSize = size + 'px ' + size + 'px';

};

TextureOverlay.prototype.onMapDrag = function() {
  var diffX = this.mousePosition.x - this.mousePositionStart.x;
  var diffY = this.mousePosition.y - this.mousePositionStart.y;

  this.mapOffset.x = this.mapOffsetStart.x + diffX;
  this.mapOffset.y = this.mapOffsetStart.y + diffY;

  if (this.isDragging) {
    this.el.style.backgroundPosition = this.mapOffset.x + 'px ' + this.mapOffset.y + 'px';
  }
};

TextureOverlay.prototype.onMouseMove = function(evt) {
  this.mousePosition.x = evt.clientX;
  this.mousePosition.y = evt.clientY;
};

TextureOverlay.prototype.addListeners = function() {

  document.addEventListener('mousemove', this.onMouseMove);

  google.maps.event.addListener(this.map, 'drag', this.onMapDrag);
  google.maps.event.addListener(this.map, 'dragstart', this.onMapDragStart);
  google.maps.event.addListener(this.map, 'dragend', this.onMapDragEnd);
  google.maps.event.addListener(this.map, 'zoom_changed', this.onZoomChanged);

};

module.exports = new TextureOverlay();
