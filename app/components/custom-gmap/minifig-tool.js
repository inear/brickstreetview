'use strict';

module.exports = MinifigTool;

var TweenMax = require('tweenmax');
var TimelineMax = require('timelinemax');

function MinifigTool(minifigMesh) {
  this.minifigMesh = minifigMesh;
  this.activeTool = null;
}

var p = MinifigTool.prototype;

p.show = function(type) {
  var self = this;
  var handMesh = this.minifigMesh.brigl.animatedMesh.handL;
  var toolMesh = handMesh.brigl.animatedMesh[type];
  var timeline = new TimelineMax();
  timeline.append(TweenMax.to(this.minifigMesh.brigl.animatedMesh.armL.rotation, 0.1, {x: Math.PI * 0.6}));
  timeline.addCallback(function() {
    toolMesh.visible = true;
    self.activeTool = type;
  });
  timeline.append(TweenMax.to(this.minifigMesh.brigl.animatedMesh.armL.rotation, 0.3, {x: Math.PI * -0.3}));
};

 p.hide = function(type) {

  var handMesh = this.minifigMesh.brigl.animatedMesh.handL;
  var toolMesh;

  var self = this;
  var timeline = new TimelineMax({onComplete: function() {
    self.activeTool = null;
  }});

  timeline.append(TweenMax.to(this.minifigMesh.brigl.animatedMesh.armL.rotation, 0.3, {x: Math.PI * 0.6}));
  timeline.addCallback(function() {
    if (type) {
      toolMesh = handMesh.brigl.animatedMesh[type];
      toolMesh.visible = false;
    } else {
      //hide all
      for (var key in handMesh.brigl.animatedMesh) {
        toolMesh = handMesh.brigl.animatedMesh[key];
        toolMesh.visible = false;
      }
    }
  });
  timeline.append(TweenMax.to(this.minifigMesh.brigl.animatedMesh.armL.rotation, 0.3, {x: Math.PI * 0.2}));
};

p.hideAll = function() {
  this.hide();
};
