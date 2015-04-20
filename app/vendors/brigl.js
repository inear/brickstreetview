/*

    BRIGL - A library to parse and render LDraw models with WEBGL.

    Copyright (C) 2012  Nicola MSX Lugato

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

		Revision 5:
		- Better error handling
		- Support for jQuery instead of prototype
		- more options

		Revision 4:
		- Animation support
		- Colored lines
		- Various fixings

		Revision 3:
		- Better step support
		- Better handling of non-BFC certified parts
		- More optimized vertex merging
		- Added smoothing of faces based on Conditional Lines
		- Various fixings

		Revision 2:
		- Added zoom and padding
		- Added mesh centering and vertex merging
		- Added crude line handling (no conditionals)
		- Added experimental step support
		- Default color now 16.

		TODO:
		- restore centering of the model
		- choose better colors?
		- handle name with spaces
*/

var THREE = require('three');
var request = require('superagent');
var legoColors = require('./../lib/lego-colors');

var BRIGL = BRIGL || { REVISION: '3' };

var opacityArray = [];
var opacityIndexMap = {};

module.exports = BRIGL;

BRIGL.log = function(msg)
{
	//console.info(msg);
};

if (typeof String.prototype.trim != 'function') {
  String.prototype.trim = function (){
    return this.replace( /^\s+|\s+$/g, '' );
  };
};
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
};
  function xclone(xxx) {
   var target = {};
   Object.keys( xxx ).map(function( kkk ) {
   	target[kkk] = xxx[kkk];
   });
   return target;
  };
BRIGL.AnimationDef = function()
{
		this.type = ""; // ROTATE, TRANSLATE (maybe SCALE?)
		this.mesh = undefined; 		// mesh to be animated
		this.vector = undefined;	// axis for rotation or delta for translation
		this.scalar = 0.0; 				// angle for rotations, or unused
		this.interpolator = undefined; // interpolation function, see http://sole.github.com/tween.js/examples/03_graphs.html

};
BRIGL.AnimationDef.prototype = {
	constructor: BRIGL.AnimationDef,
	parse: function(defstr, meshFiller)
	{
		  // sample: top ROTATE 0 0 1 90 Elastic.Out
			var tok = defstr.split(' ');


			this.mesh = meshFiller.animatedMesh[tok[0]];
			this.type = tok[1];
			this.vector = new THREE.Vector3(parseFloat(tok[2]), parseFloat(tok[3]), parseFloat(tok[4]) );
			this.scalar = parseFloat(tok[5]);
			// silly way to obtain Easing
			var intname = tok[6].split('.');
			/*var obj = TWEEN.Easing;
			for (var i=0; i<intname.length; i++)
			{
				obj = obj[intname[i]];
			}*/
			//this.interpolator = TweenMax//obj;

	},
	getFunction: function()
	{
			if(this.type==='ROTATE')
			{
					var qStart = new THREE.Quaternion();
					qStart.copy(this.mesh.quaternion);


					return (function (value) {
							var qMult = new THREE.Quaternion();
							qMult.setFromAxisAngle(this.vector, this.scalar);
							this.mesh.quaternion.multiplyMatrices(qStart, qMult);

							// cont.render();

					}).bind(this) ;
			}
			else if(this.type === 'TRANSLATE')
			{
					var vStart = new THREE.Vector3();
					vStart.copy(this.mesh.position);


					return (function (value) {
							var vDelta = new THREE.Vector3();
							vDelta.copy(this.vector);
							//vDelta.multiplyScalar( this.interpolator( value ));

							this.mesh.position.addVectors(vStart, vDelta);
							this.mesh.updateMatrix();

					}).bind(this) ;

			}
	}
};
BRIGL.Animation = function()
{
		this.name = ""; // name of animation
		this.duration = 0;  // milliseconds
		this.state = "ENABLED"; // enabled, disabled, visible
		this.defs = [];  // definitions
		this.toggle = []; // other animations to enable/disable
		this.chain = []; // other animations to chain
		this.mesh = undefined; // the mesh that contains this animation
};
BRIGL.Animation.prototype = {
	constructor: BRIGL.Animation,
	getTween:function(container, onCompleteCB)
	{

	},
	start:function(container, onComplete)
	{

	}
};
// an object used to build up the geometry when we have all pieces
BRIGL.MeshFiller = function ( ) {
  // constructor
	this.verticesMap = {}; // vertices hashmap, for fast access. We store the index of verticeArray
	this.verticesArray = []; // for indexing.
	this.faces = [];
	this.lines = {}; // dictionary color:array, contain vertices for line geometry, separated by color
	this.edgeMap = {};	//used to calculate smoothing with conditional lines
	this.wantsLines = false; // are we interested in reading lines (type2) informations?
	this.blackLines = true; // lines all black ?
	this.inverting = false; // are we currently inverting? (BFC INVERTNEXT)
	this.precisionPoints = 0; // number of decimal points, eg. 4 for epsilon of 0.0001
	this.precision = Math.pow( 10, this.precisionPoints );
	this.animatedMesh = {}; // contains a map name:Mesh with animable subparts
	this.animations = {};   // contains a map name:Animations with all animations
  this.options = undefined; // store options
};
BRIGL.MeshFiller.prototype = {
	constructor: BRIGL.MeshFiller,
	/* used for fast, order-irrelevant indexing of edges */
	edgeMapKey: function(idx1, idx2) {return Math.min(idx1,idx2)+":"+Math.max(idx1, idx2)},
	addVertice: function(v)
	{
    // add a vertice to the geometry returning the index in the array. If a vertex close enought exists, that one is returned and no vertices are added
		var key = [ Math.round( v.x * this.precision ), Math.round( v.y * this.precision ), Math.round( v.z * this.precision ) ].join( '_' );
		var res = this.verticesMap[ key ];
		if ( res === undefined ) {
			// new vertice
			res = this.verticesArray.length;
			this.verticesMap[ key ] = res; // store index for vertice V (since is new will be bottom of array)
			this.verticesArray.push(v);
		}
		return res;
	},

	addFace:function(ccw, certified, det, color, v0, v1, v2, v3)
	{
			if(!certified)
			{
          // supertrick to create 1 or 2 additional inverted faces if not certified, this problably breaks the smoothing algorithm.
					this.addFace(false, true, det, color, v2, v1, v0, v3);
					ccw = true;
			}
			var isQuad = (v3 !== undefined);

			// decide if the face should be flipped. Flipping is cumulative,
			// is done if we are inverting geometry (INVERTNEXT), the matrix determinant is negative (ie mirroring)
			// or the face is defined CW.
			var flip = this.inverting ^ (det<0.0) ^ (!ccw); // kungfu

			var idx1, idx2, idx3,idx4;
			var fa,fa1,fa2;

      var colorObj = legoColors.getColor(color);
      var colorHex = new THREE.Color(colorObj.color);
      var opacity = Math.floor((colorObj.alpha)? colorObj.alpha/255*10 : 0)/10;
      var materialIndex = 0;

      if( opacity > 0 ){
        if( opacityIndexMap['alpha_' + opacity] === undefined  ) {

          opacityIndexMap['alpha_' + opacity] = opacityArray.length;
          opacityArray.push(opacity);
        }

        materialIndex = opacityIndexMap['alpha_' + opacity] + 1;

      }

			if(isQuad)
			{

        idx1 = this.addVertice(flip?v2:v0);
        idx2 = this.addVertice(v1);
        idx3 = this.addVertice(flip?v0:v2);
        idx4 = this.addVertice(v3);

        fa1 = new THREE.Face3(idx1,idx2,idx3);
        fa1.vertexColors = [colorHex,colorHex,colorHex];
        fa1.materialIndex = materialIndex;
        this.faces.push(fa1);

        fa2 = new THREE.Face3(idx1,idx3,idx4);
        fa2.vertexColors = [colorHex,colorHex,colorHex];
        fa2.materialIndex = materialIndex;
        this.faces.push(fa2);

			}
			else
			{

        idx1 = this.addVertice(flip?v2:v0);
        idx2 = this.addVertice(v1);
        idx3 = this.addVertice(flip?v0:v2);

					fa =  new THREE.Face3(idx1, idx2, idx3);
          fa.materialIndex = materialIndex;
          fa.vertexColors = [colorHex,colorHex,colorHex];
          this.faces.push(fa);
			}



	},
	addLine:function(v1, v2, color)
	{
		if(this.blackLines) {
      color = 0; // if wants all black, just use always 0 as color
    }

		var arr = this.lines[color];
		if(!arr) { arr = []; this.lines[color] = arr; }
		arr.push(v1);
		arr.push(v2);
	},
	addCondLine:function(v1, v2)
	{
    /*var color = 0;
		var arr = this.lines[color];
    if(!arr) { arr = []; this.lines[color] = arr; }
    arr.push(v1);
    arr.push(v2);*/

		var idx1 = this.addVertice(v1);
		var idx2 = this.addVertice(v2);
		var key = this.edgeMapKey(idx1,idx2);
		this.edgeMap[key] = []; // add empy array, later this will be filled by faces sharing this edge

	},

	buildLineGeometry: function(lineVertices, material, color, dontCenter)
	{

		var geometryLines = new THREE.Geometry();
		geometryLines.vertices = lineVertices;

    geometryLines.vertices.forEach(function(v){
      geometryLines.colors.push( new THREE.Color(legoColors.getColor(color).edge));
    });


		// apply the same offset to geometryLines, thanks Three.js for returning it :P
		//if(!dontCenter)geometryLines.vertices.forEach(function(v){v.add(offset);});

		// var lineMat = new THREE.LineBasicMaterial({linewidth:3.0, color : 0x000000});

		var obj3dLines = new THREE.Line( geometryLines, material, THREE.LinePieces );

		return obj3dLines;
	},
	partToMesh: function(partSpec, options, isRoot)
	{

			this.options = options;
			var drawLines = options.drawLines ? options.drawLines : false;
			var stepLimit = options.stepLimit ? options.stepLimit : -1;
			var dontCenter = options.dontCenter ? options.dontCenter : false;
			var centerOffset = options.centerOffset ? options.centerOffset : undefined;
			var dontSmooth = options.dontSmooth ? options.dontSmooth : undefined;
			var blackLines = options.blackLines ? options.blackLines : false;
			var startColor = options.startColor ? options.startColor : 16;
			var transform = options.startingMatrix ? options.startingMatrix : new THREE.Matrix4();

			var geometrySolid = new THREE.Geometry();

			this.wantsLines = drawLines;
			this.blackLines = blackLines;

      partSpec.fillMesh(transform, startColor, this, stepLimit);

			geometrySolid.vertices = this.verticesArray;
			geometrySolid.faces = this.faces;

      var len = geometrySolid.faces.length;
      var colorObj = legoColors.getColor(startColor);
      var color = colorObj.color;

      geometrySolid.mergeVertices();
      geometrySolid.computeFaceNormals();
      geometrySolid.computeVertexNormalsWithCrease(THREE.Math.degToRad (75));

      for (i = 0; i < opacityArray.length; i++) {
        options.material.materials.push(new THREE.MeshPhongMaterial({ vertexColors: THREE.VertexColors,transparent:true,opacity:opacityArray[i]}));
      }

			var obj3d = new THREE.Mesh( geometrySolid, options.material );
			//obj3d.useQuaternion = true;
			//obj3d.quaternion = new THREE.Quaternion();

			if(drawLines){

        var lineMaterials = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors});

				if(this.blackLines)
				{
          if( this.lines[0]) {
            var obj3dLines = this.buildLineGeometry(this.lines[0], lineMaterials, 0, dontCenter);
            obj3d.add(obj3dLines);
          }
				}
				else
				{

					Object.keys( this.lines ).map((function( colKey ) {
            var obj3dLines = this.buildLineGeometry(this.lines[colKey], lineMaterials, colKey, dontCenter);
						obj3d.add(obj3dLines);
					}).bind(this));
				}
			}

			//add submesh for animations
			Object.keys( this.animatedMesh ).map((function( key ) {
				if(this.animatedMesh[key].parent === undefined) // as this contains all submodels (also subsubmodels), i check first if they aren't already added
				{
					obj3d.add(this.animatedMesh[key]);
				}
			}).bind(this));

			// add a link back to the object for animations, it will be needed later to chain them
			/*Object.keys( this.animations ).map((function( key ) {

					this.animations[key].mesh = obj3d;

				}).bind(this));
*/

			// add some data to remember it.
			var brigl = {
					part: partSpec,
					offset: new THREE.Vector3(0,0,0),
					animatedMesh: this.animatedMesh,
					animations: this.animations,
					radius: 0.0
			};

			obj3d.brigl = brigl;

			// new centering, needs great improvement
			/*if(isRoot && (!dontCenter))
			{
				if(centerOffset)
				{
					brigl.offset.copy(centerOffset);

				}
				else
				{
					var min = new THREE.Vector3(100000.0,100000.0,100000.0);
					var max = new THREE.Vector3(-100000.0,-100000.0,-100000.0);;
					obj3d.traverse( function(child){
						  if( child.brigl !== undefined)
						  {
							child.updateMatrixWorld(true);
							var v = child.localToWorld(new THREE.Vector3(0,0,0));
							var r = child.boundRadius;
							max.x = Math.max(max.x, v.x+r);
							max.y = Math.max(max.y, v.y+r);
							max.z = Math.max(max.z, v.z+r);
							min.x = Math.min(min.x, v.x-r);
							min.y = Math.min(min.y, v.y-r);
							min.z = Math.min(min.z, v.z-r);
							//alert(child.brigl.part.partName+" "+v.x+","+v.y+","+v.z+"  - radius "+r);
							}
						}
					);
					var radius = Math.max(Math.abs(max.x),Math.abs(max.y),Math.abs(max.z), Math.abs(min.x), Math.abs(min.y), Math.abs(min.z));
					//alert(radius);
					brigl.radius = radius;
					brigl.offset = new THREE.Vector3();
					brigl.offset.addVectors(max, min);
					brigl.offset.multiplyScalar( -0.5 );

				}
				obj3d.position.add(brigl.offset);
				obj3d.updateMatrix();
			}
      */
			// -------------


			return obj3d;
	}

};



// Abstract class for different lines in LDraw format (supported: 0,1,3,4. ignored: 2, 5 (lines))
BRIGL.BrickSpec = function ( ) {
	// constructor
};

BRIGL.BrickSpec.prototype = {
	constructor: BRIGL.BrickSpec,
};

// Class representing lines of type 0 (comments) some BFC format is supported
BRIGL.CommentSpec = function ( vals ) {
	// constructor
	this.vals = vals;
};
BRIGL.CommentSpec.prototype = Object.create( BRIGL.BrickSpec.prototype );
BRIGL.CommentSpec.prototype = {

	constructor: BRIGL.CommentSpec,
	isCertify: function()
	{
		return ( (this.vals.length>=2) && (this.vals[1] === "BFC") && (this.vals[2] === "CERTIFY") );
	},
	isCertifyCcw: function()
	{
		if ( (this.isCertify()) && (this.vals.length == 4))
		{
				return this.vals[3] === "CCW";
		}
		return true;
	},
	isAnimated: function()
	{
		return ( (this.vals.length>=2) && (this.vals[1] === "SIMPLEANIM") && (this.vals[2] === "ANIMATED") );
	},
	animatedName: function()
	{
		return this.vals[3];
	},
	isInvertNext: function()
	{
		return ( (this.vals.length>=2) && (this.vals[1] === "BFC") && (this.vals[2] === "INVERTNEXT") );
	},
	isBfcCcw: function()
	{
		return ( (this.vals.length==3) && (this.vals[1] === "BFC") && (this.vals[2] === "CCW") );
	},
	isBfcCw: function()
	{
		return ( (this.vals.length==3) && (this.vals[1] === "BFC") && (this.vals[2] === "CW") );
	},
	isStep: function()
	{
		return ( (this.vals.length==2) && (this.vals[1] === "STEP") );
	},
	fillMesh: function (transform, currentColor, meshFiller)
	{
		// if it is an animation definition, parse and add it
		if ((this.vals.length>3) && (this.vals[1] === "SIMPLEANIM") && (this.vals[2] === "ANIMATION")){

			var animation = new BRIGL.Animation();
			animation.name = this.vals[3];
			meshFiller.animations[animation.name] = animation;
	}
	}
};

// this represent a part, has a list of BrickSpec inside
BRIGL.PartSpec = function ( partName ) {
	// constructor
	this.partName = partName;
  this.lines = [];
	this.fullyLoaded = false; // if this part is completely loaded with all children or not
	this.waiters = []; // list of callbacks to be called when this part is ready.
	this.numSteps = 1; // number of steps encountered
};
BRIGL.PartSpec.prototype = Object.create( BRIGL.BrickSpec.prototype );
BRIGL.PartSpec.prototype = {

	constructor: BRIGL.PartSpec,
	addLine: function(brickSpec)
	{
			this.lines.push(brickSpec);
			if((brickSpec.isStep) && (brickSpec.isStep()))
			{
							this.numSteps++;
			}
	},
	fillMesh: function (transform, currentColor, meshFiller, stepLimit)
	{
			for (var i=0; i<this.lines.length; i++)
			{
					var spec = this.lines[i];
					if((spec.isStep) && (spec.isStep()))
					{
							stepLimit--;
							if(stepLimit==0) return;
					}
          if (spec.subpartName) {
            //if( meshFiller.options.optimized && (li.toLowerCase().indexOf('ring') !== -1 || li.toLowerCase().indexOf('stug') !== -1 || li.toLowerCase().indexOf('stud3') !== -1 || li.toLowerCase().indexOf('stud4') !== -1)) {
            if(meshFiller.options.optimized && (spec.subpartName.indexOf('ring') !== -1 || spec.subpartName.indexOf('stug') !== -1 || spec.subpartName.indexOf('stud3') !== -1 || spec.subpartName.indexOf('stud4') !== -1)) {
              continue;
            }
          }


					spec.fillMesh(transform, currentColor, meshFiller);
			}
	},
	wakeWaiters: function()
	{
			this.fullyLoaded = true;
			for (var i=0; i<this.waiters.length; i++)
			{
					this.waiters[i]();
			}
			delete this.waiters;
	},
	whenReady: function(callback)
	{
			// if we are already loaded, call callback immediately
			this.fullyLoaded ? callback() : this.waiters.push(callback);
	}
};

// This class represent lines of type 1, subparts
BRIGL.SubPartSpec = function ( vals, inverted, animated, animatedName ) {
	// constructor
  this.color = parseInt(vals[1]);
	this.inverted = inverted;
	this.animated = animated;
	this.animatedName = animatedName;
	this.subpartName = vals.slice(14).join(" ").toLowerCase(); // join laste elements after 14^, work only if user use single space delimiter..
	this.subpartSpec = undefined;
	this.matrix = new THREE.Matrix4().set(
	  parseFloat(vals[5]), parseFloat(vals[6]), parseFloat(vals[7]), parseFloat(vals[2]),
	  parseFloat(vals[8]), parseFloat(vals[9]), parseFloat(vals[10]), parseFloat(vals[3]),
		parseFloat(vals[11]), parseFloat(vals[12]), parseFloat(vals[13]), parseFloat(vals[4]),
		0.0, 0.0, 0.0, 1.0
	);
};
BRIGL.SubPartSpec.prototype = Object.create( BRIGL.BrickSpec.prototype );
BRIGL.SubPartSpec.prototype = {

	constructor: BRIGL.SubPartSpec,
	fillMesh: function (transform, currentColor, meshFiller)
	{
			if(this.inverted) meshFiller.inverting = !meshFiller.inverting;

			var nt = new THREE.Matrix4();
			nt.multiplyMatrices(transform, this.matrix);
			var c = ((this.color == 16) || (this.color == 24)) ? currentColor : this.color;

			if(this.animated)
			{
				var subPartPos = new THREE.Vector3().setFromMatrixPosition( nt );
				var subPartPosNegated = subPartPos.clone().negate();
				// create a subfiller and a Mesh for this branch
				var subFiller = new BRIGL.MeshFiller();
				var opt2 = xclone(meshFiller.options); // use same options...
				opt2.dontCenter = true; // ...except don't center
				opt2.startColor = c; // use current color as starting color

				var subMesh = subFiller.partToMesh(this.subpartSpec, opt2, false); // create submesh
				subMesh.applyMatrix(nt);
				// since i'm using quats, i have to bring rotation separately
				subMesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().extractRotation(nt));
				//subMesh.updateMatrix();
				meshFiller.animatedMesh[this.animatedName] = subMesh; // add submesh to parent filler
				// also add all submesh animatedMesh (so the first one has all the mappings)
				Object.keys( subFiller.animatedMesh ).map(function( key ) {
					meshFiller.animatedMesh[key] = subFiller.animatedMesh[key];
   			});
   			// same for animations
				Object.keys( subFiller.animations ).map(function( key ) {
					meshFiller.animations[key] = subFiller.animations[key];
   			});

			}
			else
			{
				this.subpartSpec.fillMesh(nt, c, meshFiller);
			}

			if(this.inverted) meshFiller.inverting = !meshFiller.inverting;
	}
};

// This class represent lines of type 2, lines
BRIGL.LineSpec = function ( vals ) {
	// constructor
	this.color = parseInt(vals[1]);
	this.one = new THREE.Vector3( parseFloat(vals[2]), parseFloat(vals[3]), parseFloat(vals[4]) );
	this.two = new THREE.Vector3( parseFloat(vals[5]), parseFloat(vals[6]), parseFloat(vals[7]) );
};
BRIGL.LineSpec.prototype = Object.create( BRIGL.BrickSpec.prototype );
BRIGL.LineSpec.prototype.constructor = BRIGL.LineSpec;
BRIGL.LineSpec.prototype.fillMesh = function (transform, currentColor, meshFiller)
	{
			if(!meshFiller.wantsLines) return; // not interested
			var c = ((this.color == 16) || (this.color == 24)) ? currentColor : this.color;
			meshFiller.addLine(this.one.clone().applyMatrix4(transform),this.two.clone().applyMatrix4(transform), c);
	};

// This class represent lines of type 5, conditional lines
BRIGL.CondLineSpec = function ( vals ) {
	// constructor
	this.color = parseInt(vals[1]);
	this.one = new THREE.Vector3( parseFloat(vals[2]), parseFloat(vals[3]), parseFloat(vals[4]) );
	this.two = new THREE.Vector3( parseFloat(vals[5]), parseFloat(vals[6]), parseFloat(vals[7]) );
};
BRIGL.CondLineSpec.prototype = Object.create( BRIGL.BrickSpec.prototype );
BRIGL.CondLineSpec.prototype.constructor = BRIGL.CondLineSpec;
BRIGL.CondLineSpec.prototype.fillMesh = function (transform, currentColor, meshFiller)
	{
		  var c = ((this.color == 16) || (this.color == 24)) ? currentColor : this.color;
			meshFiller.addCondLine(this.one.clone().applyMatrix4(transform),this.two.clone().applyMatrix4(transform));
	};

// This class represent lines of type 3, triangles
BRIGL.TriangleSpec = function ( vals, ccw, certified ) {
	// constructor
	this.ccw = ccw;
	this.certified = certified;
	this.color = parseInt(vals[1]);
	this.one = new THREE.Vector3( parseFloat(vals[2]), parseFloat(vals[3]), parseFloat(vals[4]) );
	this.two = new THREE.Vector3( parseFloat(vals[5]), parseFloat(vals[6]), parseFloat(vals[7]) );
	this.three = new THREE.Vector3( parseFloat(vals[8]), parseFloat(vals[9]), parseFloat(vals[10]) );
};
BRIGL.TriangleSpec.prototype = Object.create( BRIGL.BrickSpec.prototype );
BRIGL.TriangleSpec.prototype.constructor = BRIGL.TriangleSpec;
BRIGL.TriangleSpec.prototype.fillMesh = function (transform, currentColor, meshFiller)
	{

			var det = transform.determinant(); // this is equal for all tri and quad in PartSpec, could be calculated before
			var c = ((this.color == 16) || (this.color == 24)) ? currentColor : this.color;
			meshFiller.addFace(this.ccw, this.certified, det, c,
					this.one.clone().applyMatrix4(transform),
					this.two.clone().applyMatrix4(transform),
					this.three.clone().applyMatrix4(transform));
	};

// This class represent lines of type 4, quads
BRIGL.QuadSpec = function ( vals, ccw, certified ) {
	// constructor
	this.ccw = ccw;
	this.certified = certified;
	this.color = parseInt(vals[1]);
	this.one = new THREE.Vector3( parseFloat(vals[2]), parseFloat(vals[3]), parseFloat(vals[4]) );
	this.two = new THREE.Vector3( parseFloat(vals[5]), parseFloat(vals[6]), parseFloat(vals[7]) );
	this.three = new THREE.Vector3( parseFloat(vals[8]), parseFloat(vals[9]), parseFloat(vals[10]) );
	this.four = new THREE.Vector3( parseFloat(vals[11]), parseFloat(vals[12]), parseFloat(vals[13]) );
};
BRIGL.QuadSpec.prototype = Object.create( BRIGL.BrickSpec.prototype );
BRIGL.QuadSpec.prototype.constructor= BRIGL.QuadSpec;
BRIGL.QuadSpec.prototype.fillMesh = function (transform, currentColor, meshFiller)
	{
			//BRIGL.log("fillMesh for quad");
			var det = transform.determinant();
			var c = ((this.color == 16) || (this.color == 24)) ? currentColor : this.color;
      /*if( c === 40 ) {

      }*/

			meshFiller.addFace(this.ccw, this.certified, det, c,
				this.one.clone().applyMatrix4(transform),
				this.two.clone().applyMatrix4(transform),
				this.three.clone().applyMatrix4(transform),
				this.four.clone().applyMatrix4(transform)
			);

	};

BRIGL.Builder = function (partsUrl, library, options ) {
	// constructor
	if(!options) options = {};
  this.library = library;
	this.partCache =  {};
	this.partRequests = {};
	this.partsUrl = partsUrl;
	this.asyncnum = 0;
	this.options = options;

  this.material = new THREE.MeshFaceMaterial([
    new THREE.MeshPhongMaterial({ vertexColors: THREE.VertexColors, shininess:80, specular:0x222222, wrapAround:true})
  ]);

  this.options.material = this.material;


};

BRIGL.Builder.prototype = {

	constructor: BRIGL.Builder,

  cleanCache: function()
  {
  		this.partCache = {};
  },

	cacheCount: function ()
	{
			return Object.keys(this.partCache).length;
	},

	asyncReq: function(partName, callback)
	{
		var purl;
		if(this.options.forceLowercase) {
				partName = partName.toLowerCase();
		}
		if(this.options.dontUseSubfolders) {
		    purl = this.partsUrl+partName;
		} else {
			purl = this.partsUrl+partName.charAt(0)+"/"+partName; // replicate first char to subdivide in more folders
		}
		this.asyncReqUrl(purl, callback);
	},

	asyncReqUrl: function(purl, callback)
	{
    var self = this;

		var purl = purl.replace(/\\/gi,"/");
		this.asyncnum++;

    request.get(purl, function(error,res){
      if( error && error.status) {

        self.asyncnum--;
        var msg = error.status+" - "+error.responseText;
        console.log('cant find: ' + purl);
        self.errorCallback(msg);

        return;
      }

      self.asyncnum--;

      callback(res.text);

    });

	},

  // Loads a model from the part server and return the Mesh
	loadModelByName: function (partName, options, callback, errorCallback) {

		this.errorCallback = errorCallback;
		if(!options) options = {};
		var partSpec = this.getPart(partName);

		partSpec.whenReady((function()
		{
			//this.buildAndReturnMesh(partSpec, callback, options.drawLines?options.drawLines:false, options.stepLimit ? options.stepLimit : -1);

      options.material = this.material;

			var meshFiller = new BRIGL.MeshFiller();
      meshFiller.optimized = options.optimized;
			var mesh;
			try
			{
				mesh = meshFiller.partToMesh(partSpec, options, true);
			}
			catch(e)
			{
				errorCallback("Error in partToMesh "+ e );
				return;
			}
			BRIGL.log("Model loaded successfully");
			callback(mesh);

		}).bind(this)
		);
	},

  // Loads a model from the data provided and return the Mesh
  loadModelFromLibrary: function (partName,  options, callback, errorCallback) {

    BRIGL.log("Parsing from library: "+partName+"...");

    if(!options) options = {};
    options.material = this.material;

    partName = partName.toLowerCase();
    this.errorCallback = errorCallback;
    var partSpec = new BRIGL.PartSpec(partName);
    this.partCache[partSpec.partName] = partSpec;
    var partData = this.library[partSpec.partName];

    this.parsePart(partSpec, partData);

    partSpec.whenReady((function()
    {
      this.loadModelByName(partName, options, callback, errorCallback);
    }).bind(this)
    );
  },

	// Loads a model from the data provided and return the Mesh
	loadModelByData: function (partName, partData, options, callback, errorCallback) {

		BRIGL.log("Parsing from data: "+partName+"...");

    if(!options) options = {};
    options.material = this.material;

		partName = partName.toLowerCase();
		this.errorCallback = errorCallback;
		var partSpec = new BRIGL.PartSpec(partName);
		this.partCache[partSpec.partName] = partSpec;
		this.parsePart(partSpec, partData);

		partSpec.whenReady((function()
		{
				this.loadModelByName(partName, options, callback, errorCallback);
		}).bind(this)
		);
	},

	// Loads a model from an url. It must be on the same server or the server/browser must allow crossorigin fetch
	loadModelByUrl: function (purl, options, callback, errorCallback) {

    if(!options) options = {};
    options.material = this.faceMaterial;

		this.errorCallback = errorCallback;
		BRIGL.log("Parsing by url: "+purl+"...");

		this.asyncReqUrl(purl, (function(docContent)
		{
			BRIGL.log("File downloaded.");
			this.loadModelByData("UrlLoaded.ldr", docContent, options, callback, errorCallback);
		}).bind(this)

		);
	},



	parsePart: function(partSpec, partData)
	{

		// parses some text and fill the PartSpec in input
		var lines = partData.split("\n");
		if (this.isMultipart(lines))
		{
			this.parseMultiPart(partSpec, lines);
		}
		else
		{
			this.parseSinglePart(partSpec, lines);
		}
	},

	parseSinglePart: function(partSpec, lines)
	{
		// parses some text and build a PartSpec fully populated with BrickSpec children

		var inverted = false; 	// next should be inverted?
		var animated = false;		// next should be animated?
		var animatedName = undefined; //valid only if animated
		var ccw = true;					// dealing with ccw or cw ?
		var certified = false;  // certified BFC ?

		for (var i=0; i<lines.length; i++)
		{
				var li = lines[i].trim();
        if(li==='') continue;

				var tokens = li.split(/[ \t]+/);
				if(tokens[0] === '0')
				{
					var cs = new BRIGL.CommentSpec(tokens);
					partSpec.addLine(cs);
					if (cs.isInvertNext()) {
						inverted = true;
					}
					else if (cs.isCertify()) {
						certified = true;
						ccw = cs.isCertifyCcw();
					}
					else if(cs.isBfcCcw())
					{
							ccw = true;
					}
					else if(cs.isAnimated())
					{
							animated = true;
							animatedName = cs.animatedName();
					}
					else if(cs.isBfcCw())
					{
							ccw = false;
					}
				}
				else if(tokens[0] === '1')
				{
					partSpec.addLine(new BRIGL.SubPartSpec(tokens, inverted, animated, animatedName));
					inverted = false;
					animated = false;
					animatedName = undefined;
				}
				else if(tokens[0] === '2')
				{
					partSpec.addLine(new BRIGL.LineSpec(tokens));
				}
				else if(tokens[0] === '3')
				{
					partSpec.addLine(new BRIGL.TriangleSpec(tokens, ccw, certified));
				}
				else if(tokens[0] === '4')
				{
					partSpec.addLine(new BRIGL.QuadSpec(tokens, ccw, certified));
				}
				else if(tokens[0] === '5')
				{
					partSpec.addLine(new BRIGL.CondLineSpec(tokens));
				}
		}
		this.populateSubparts(partSpec);
	},

	parseMultiPart: function(part, lines)
	{
		// parses some text and build a PartSpec fully populated with BrickSpec children
		BRIGL.log("Parsing multipart "+part.partName);

		var currentName = "";
		var stuff = [];
		var currentStuff = null;

		// first we parse all part block into a buffer..
		for (var i=0; i<lines.length; i++)
		{
				var li = lines[i].trim();
				if(li==='') {
          continue;
        }

				if(li.startsWith("0 FILE "))
				{
						if(currentStuff)
						{
								// if we were already scanning a part, store it before starting the new one
								stuff.push(currentStuff);
						}
						var subname = li.substring(7).toLowerCase();

						// already create and cache the partSpec so we can reference it early to load unordered multipart models
						var subPartSpec = new BRIGL.PartSpec(subname);
						this.partCache[subname] = subPartSpec;

						currentStuff = { partName: subname, lines: [], partSpec: subPartSpec };
				}
				else
				{
					if (currentStuff) currentStuff.lines.push(li);
				}
		}
		if(currentStuff)
		{
				// handle it
				stuff.push(currentStuff);
		}
		BRIGL.log("Total subparts: "+stuff.length);

		// scroll backward becouse first parts depend on last parts
		for (var i=stuff.length-1; i>=0; i--)
		{
				var last = stuff[i];
				var partSpec;
				if(i == 0)
				{
							// as this is the first and main part, use partSpec received in input
							partSpec = part;
				}
				else
				{
							// this is a subpart, use the partSpec we created early
							partSpec = last.partSpec; // new BRIGL.PartSpec(last.partName.toLowerCase());
							// this.partCache[partSpec.partName] = partSpec;
				}
				this.parseSinglePart(partSpec, last.lines);
		}
	},

	// tests if an array of lines is a multipart
	isMultipart: function(lines)
	{
		for (var i=0; i<lines.length; i++)
		{
				var li = lines[i].trim();
				if(li==='') continue;

				if(li.startsWith("0 FILE "))
				{
						return true;
				}
				else if( li.startsWith("1") || li.startsWith("2") || li.startsWith("3")||li.startsWith("4")||li.startsWith("5") )
				{
						// as per specifications, any command before a 0 FILE means no multipart
						return false;
				}
		}
		return false;
	},

	getPart: function(partName)
	{
			// obtain a PartSpec, either from local cache or from server
			var p = this.partCache[partName];

			if(p)
			{
        return p;
			}
			else
			{

          var p = new BRIGL.PartSpec(partName);
					this.partCache[partName] = p;

					// the part is not being downloaded, we'll start it!
					BRIGL.log("Loading " + partName);

          var justFileName = String(partName).replace(/^.*[\\\/]/, '')

          if( this.library[partName]) {
            this.parsePart(p, this.library[partName]);
            return p;
          }
          else if( this.library[justFileName]) {
            this.parsePart(p, this.library[justFileName]);
            return p;
          }
          else {
            this.asyncReq(partName, (function(txt)
            {
                // when async return, parse part
                this.parsePart(p, txt);
            }).bind(this));

            return p;
          }

			}
	},

	populateSubparts: function(partSpec)
	{
			// takes a PartSpec and scan for all SubpartSpec (type 1)
			// for each one it loads the correct PartSpec (we loaded only the name before)
			var toLoad = [];
			for (var i=0; i<partSpec.lines.length; i++)
			{
					var spec = partSpec.lines[i];
					if(spec instanceof BRIGL.SubPartSpec)
					{
							if(spec.subpartSpec === undefined)
							{
								toLoad.push( spec );
							}
					}
			}
			// now toLoad contains all the subpart that need loading.
			var count = toLoad.length;
			if(count == 0)
			{
				// no subpart to load, we are ready!
				partSpec.wakeWaiters();
			}
			else
			{
				  for (var i=0; i<toLoad.length; i++)
					{
						  var spec = toLoad[i];
							var subSpec = this.getPart(spec.subpartName);
							spec.subpartSpec = subSpec;

							// all subpart must be ready before we call the callback
							subSpec.whenReady(function(){
									count--; // decrease total amount of parts we are waiting for
									if(count==0)
									{
											// now all subparts are in place, wake up all "process" waiting for this part to be fully loaded
											partSpec.wakeWaiters();
									}
							});
				  }
			}
	}
};


THREE.Geometry.prototype.computeVertexNormalsWithCrease = function (maxSmoothAngle)
{
  var v, vl, f, fl, face,
    faceIndicesPerVertex = [];

  for (v = 0, vl = this.vertices.length; v < vl; v ++) {

    faceIndicesPerVertex.push([])

  }

  for (f = 0, fl = this.faces.length; f < fl; f ++) {

    face = this.faces[ f ];

    if ( face instanceof THREE.Face3 ) {

      faceIndicesPerVertex[face.a].push(f);
      faceIndicesPerVertex[face.b].push(f);
      faceIndicesPerVertex[face.c].push(f);

    } else if ( face instanceof THREE.Face4 ) {

      faceIndicesPerVertex[face.a].push(f);
      faceIndicesPerVertex[face.b].push(f);
      faceIndicesPerVertex[face.c].push(f);
      faceIndicesPerVertex[face.d].push(f);

    }

  }

  // for each face...

  for (f = 0, fl = this.faces.length; f < fl; f ++) {

    face = this.faces[ f ];

    var faceVertexCount;
    if ( face instanceof THREE.Face3 )
      faceVertexCount = 3;
    else if ( face instanceof THREE.Face4 )
      faceVertexCount = 4;
    else
      continue;

    // for each vertex of the face...

    for ( var fv = 0; fv < faceVertexCount; fv ++ ) {

      var vertexIndex = face[ 'abcd'.charAt( fv ) ];

      var vertexFaces = faceIndicesPerVertex[ vertexIndex ];

      var vertexNormal = face.normal.clone();

      // for each neighbouring face that shares this vertex...

      for ( var vf = 0; vf < vertexFaces.length; vf ++ ) {

        var neighbourFaceIndex = vertexFaces[vf];

        var neighbourFace = this.faces[neighbourFaceIndex];

        // disregard the face we're working with
        if (neighbourFace === face)
          continue;

        // given both normals are unit vectors, the angle is just acos(a.dot(b))
        var theta = Math.acos(face.normal.dot(neighbourFace.normal));

        if (theta <= maxSmoothAngle) {

          vertexNormal.add(neighbourFace.normal);

        }

      }

      vertexNormal.normalize();

      face.vertexNormals[ fv ] = vertexNormal;
    }

  }

}
