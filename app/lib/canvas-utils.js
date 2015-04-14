'use strict';

module.exports.legofy = function(ctx, normalCtx, renderOptions, w, h) {

  var fillColor = {
    r: 0,
    g: 0,
    b: 0,
    a: 255
  };

  if( normalCtx ) {
    for (var testY = 0; testY < 5; testY++) {
      floodfill(Math.floor(w * 0.5), Math.floor(h / testY * 0.08), fillColor, ctx, w, h, 60);
    }

    for (testY = 0; testY < 5; testY++) {
      floodfill(Math.floor(3), Math.floor(h / testY * 0.08), fillColor, ctx, w, h, 50);
    }
  }


  var imgData = ctx.getImageData(0, 0, w, h).data;
  var normalData = normalCtx ? normalCtx.getImageData(0, 0, 512, 256).data : null;

  function isArray(o) {
    return Object.prototype.toString.call(o) === '[object Array]';
  }
  function isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
  }

  var lastRed, lastGreen, lastBlue, isFlatBrick, isSky;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0)';
  ctx.clearRect(0, 0, w, h);
  ctx.fillRect(0, 0, w, h);

  for (var i = 0, len = renderOptions.length; i < len; i++) {
    var opts = renderOptions[i],

      resX = opts.resolutionX,
      resY = opts.resolutionY,

      // option defaults
      sizeX = opts.sizeX || resX,
      sizeY = opts.sizeY || resY,
      alpha = opts.alpha || 1,
      offset = opts.offset || 0,
      offsetX = 0,
      offsetY = 0,
      cols = w / resX + 1,
      rows = h / Math.floor(resY) * 0.5 + 1 + 20,
      brickW = sizeX / 2,
      brickH = sizeY * 0.66;


    if (isObject(offset)) {
      offsetX = offset.x || 0;
      offsetY = offset.y || 0;
    } else if (isArray(offset)) {
      offsetX = offset[0] || 0;
      offsetY = offset[1] || 0;
    } else {
      offsetX = offsetY = offset;
    }

    for (var row = 0; row < rows; row++) {


      var perspectiveY, perspectiveX;
      var y = (row - 0.5) * resY;

      var pixelY = Math.max(Math.min(y, h - 1), 0);

      if (row < 10) {
        //continue;
      }

      for (var col = 0; col < cols; col++) {
        var x = (col - 0.5) * resX + offsetX,
          // normalize y so shapes around edges get color
          pixelX = Math.max(Math.min(x, w - 1), 0),
          pixelIndex = (pixelX + pixelY * w) * 4,
          red = imgData[pixelIndex + 0],
          green = imgData[pixelIndex + 1],
          blue = imgData[pixelIndex + 2],
          pixelAlpha = alpha * (imgData[pixelIndex + 3] / 255);


        if (red === 0 && green === 0 && blue === 0) {

          lastRed = red;
          lastGreen = green;
          lastBlue = blue;

          ctx.clearRect(pixelX - brickW, 0, brickW * 2, pixelY);
          continue;
        }

        /*red = red - (red % 4)
        green = green - (green % 4)
        blue = blue - (blue % 4)
*/
        if (normalCtx) {
          var normalPixelIndex = (Math.floor(col / cols * 512) + Math.floor(row / rows * 170) * 512) * 4;
          var normalR = normalData[normalPixelIndex];
          var normalG = normalData[normalPixelIndex + 1];
          var normalB = normalData[normalPixelIndex + 2];


          //red = normalR;
          //green = normalG;
          //blue = normalB;

          if (normalR >= 100 && normalG <= 10 && normalB >= 100) {
            continue;
          }
        }

        if (normalR === 128 && normalG === 128 && normalB === 128 && row < rows * 0.2) {
          isSky = true;
        } else {
          isSky = false;
        }

        ctx.lineWidth = 0;

        ctx.save();

        if (Math.random() > 0.3 || (red === lastRed && blue === lastBlue && green === lastGreen)) {
          isFlatBrick = true;
          perspectiveY = 0;
          brickH = sizeY * 0.99;
          perspectiveX = 0.5;
        } else {
          brickH = sizeY * 0.96;
          isFlatBrick = false;
          perspectiveY = -0.2 + Math.min(1, 1 - (y + h * 0.5) / (h));
          perspectiveX = normalCtx ? (Math.max(0.2, (normalG + normalR) * 0.5 / 255 * 2 - 1)) : 0.5;
        }


        //ctx.translate( x , y-2*row +(Math.random()*1-0.5));
        ctx.translate(x, y - row * 0.8 - isFlatBrick * 0.8);

        ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + pixelAlpha * 1 + ')';
        ctx.beginPath();
        ctx.moveTo(perspectiveX * brickW * 0.5, 0);
        ctx.lineTo(perspectiveX * brickW * 0.5, -brickH);
        ctx.lineTo(brickW, -brickH + (brickH * 0.5) * perspectiveY);
        ctx.lineTo(brickW, 0 + (brickH * 0.5) * perspectiveY);
        ctx.moveTo(perspectiveX * brickW * 0.5, 0);
        ctx.fill();
        ctx.beginPath();

        ctx.fillStyle = 'rgba(' + Math.floor(red * (isFlatBrick ? 1 : 0.9)) + ',' + Math.floor(green * (isFlatBrick ? 1 : 0.9)) + ',' + Math.floor(blue * (isFlatBrick ? 1 : 0.9)) + ',1)';

        ctx.beginPath();
        ctx.moveTo(perspectiveX * brickW * 0.5, 0);
        ctx.lineTo(perspectiveX * brickW * 0.5, -brickH);
        ctx.lineTo(-brickW, -brickH + (brickH * 0.5) * perspectiveY);
        ctx.lineTo(-brickW, 0 + (brickH * 0.5) * perspectiveY);
        ctx.moveTo(perspectiveX * brickW * 0.5, 0);
        ctx.fill();
        ctx.closePath();

        //perspective
        if (isFlatBrick && lastRed === 0 && lastGreen === 0 && lastBlue === 0) {
          ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + pixelAlpha * 1 + ')';
          ctx.beginPath();
          ctx.moveTo(-brickW, 0);
          ctx.lineTo(-brickW - 3, 3);
          ctx.lineTo(-brickW - 3, -brickH + 3);
          ctx.lineTo(-brickW, -brickH);
          ctx.moveTo(-brickW, 0);
          ctx.fill();
          ctx.closePath();
        }

        //if( Math.random() > 0.5 && perspectiveY < 0) {
        if (perspectiveY < 0) {

          ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + 1 + ')';
          ctx.beginPath();
          ctx.moveTo(0, -brickH * 1);
          ctx.lineTo(-brickW, -brickH * 1 + brickH * 0.5 * perspectiveY);
          ctx.lineTo(0, -brickH * 1 + (brickH) * perspectiveY);
          ctx.lineTo(brickW, -brickH * 1 + brickH * 0.5 * perspectiveY);
          ctx.moveTo(0, -brickH * 1);
          ctx.fill();
          ctx.closePath();

        }

        if (!isSky && isFlatBrick && green > 80 && red < green && blue < green) {
          ctx.fillStyle = 'rgba(' + 0 + ',' + 0 + ',' + 0 + ',' + 0.2 + ')';
          drawEllipse(ctx, -brickW * .5, brickH * -.75, brickW, brickH * 0.5);
          ctx.fill();

          ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + pixelAlpha + ')';
          drawEllipse(ctx, -brickW * .4, brickH * -.8, brickW * 0.9, brickH * 0.4);
          ctx.fill();
        }

        lastRed = red;
        lastGreen = green;
        lastBlue = blue;

        ctx.restore();

      } // col
    } // row
  } // options

};

module.exports.renderPreview = function(ctx, renderOptions, w, h) {

  /*var fillColor = {
    r: 0,
    g: 0,
    b: 0,
    a: 255
  };
  for (var testY = 0; testY < 10; testY++) {
    floodfill(Math.floor(w * 0.5), Math.floor(h / testY * 0.07), fillColor, ctx, w, h, 30);
  }

  for (testY = 0; testY < 10; testY++) {
    floodfill(Math.floor(3), Math.floor(h / testY * 0.07), fillColor, ctx, w, h, 30);
  }
  */

  var imgData = ctx.getImageData(0, 0, w, h).data;

  function isArray(o) {
    return Object.prototype.toString.call(o) === '[object Array]';
  }
  function isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
  }

  var lastRed, lastGreen, lastBlue, isFlatBrick;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.clearRect(0, 0, w, h);
  ctx.fillRect(0, 0, w, h);

  for (var i = 0, len = renderOptions.length; i < len; i++) {
    var opts = renderOptions[i],

      resX = opts.resolutionX,
      resY = opts.resolutionY,

      // option defaults
      sizeX = opts.sizeX || resX,
      sizeY = opts.sizeY || resY,
      alpha = opts.alpha || 1,
      offset = opts.offset || 0,
      offsetX = 0,
      offsetY = 0,
      cols = w / resX + 1,
      rows = h / Math.floor(resY) * 0.5 + 1 + 20,
      brickW = sizeX / 2,
      brickH = sizeY * 0.66;


    if (isObject(offset)) {
      offsetX = offset.x || 0;
      offsetY = offset.y || 0;
    } else if (isArray(offset)) {
      offsetX = offset[0] || 0;
      offsetY = offset[1] || 0;
    } else {
      offsetX = offsetY = offset;
    }

    for (var row = 0; row < rows; row++) {


      var perspectiveY, perspectiveX;
      var y = (row - 0.5) * resY;

      var pixelY = Math.max(Math.min(y, h - 1), 0);

      for (var col = 0; col < cols; col++) {
        var x = (col - 0.5) * resX + offsetX,
          // normalize y so shapes around edges get color
          pixelX = Math.max(Math.min(x, w - 1), 0),
          pixelIndex = (pixelX + pixelY * w) * 4,
          red = imgData[pixelIndex + 0],
          green = imgData[pixelIndex + 1],
          blue = imgData[pixelIndex + 2],
          pixelAlpha = alpha * (imgData[pixelIndex + 3] / 255);


        if (red === 0 && green === 0 && blue === 0) {

          lastRed = red;
          lastGreen = green;
          lastBlue = blue;

          ctx.clearRect(pixelX - brickW, 0, brickW * 2, pixelY);
          continue;
        }

        /*red = red - (red % 4)
        green = green - (green % 4)
        blue = blue - (blue % 4)
*/

        ctx.lineWidth = 0;
        ctx.save();

        if (Math.random() > 0.3 || (red === lastRed && blue === lastBlue && green === lastGreen)) {
          isFlatBrick = true;
          perspectiveY = 0;
          brickH = sizeY * 0.99;
          perspectiveX = 0.5;
        } else {
          brickH = sizeY * 0.96;
          isFlatBrick = false;
          perspectiveY = -0.2 + Math.min(1, 1 - (y + h * 0.5) / (h));
          perspectiveX = 0.5;
        }

        //ctx.translate( x , y-2*row +(Math.random()*1-0.5));
        ctx.translate(x, y - row * 0.8 - isFlatBrick * 0.8);

        ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + pixelAlpha * 1 + ')';
        ctx.beginPath();
        ctx.moveTo(perspectiveX * brickW * 0.5, 0);
        ctx.lineTo(perspectiveX * brickW * 0.5, -brickH);
        ctx.lineTo(brickW, -brickH + (brickH * 0.5) * perspectiveY);
        ctx.lineTo(brickW, 0 + (brickH * 0.5) * perspectiveY);
        ctx.moveTo(perspectiveX * brickW * 0.5, 0);
        ctx.fill();
        ctx.beginPath();

        ctx.fillStyle = 'rgba(' + Math.floor(red * (isFlatBrick ? 1 : 0.9)) + ',' + Math.floor(green * (isFlatBrick ? 1 : 0.9)) + ',' + Math.floor(blue * (isFlatBrick ? 1 : 0.9)) + ',1)';

        ctx.beginPath();
        ctx.moveTo(perspectiveX * brickW * 0.5, 0);
        ctx.lineTo(perspectiveX * brickW * 0.5, -brickH);
        ctx.lineTo(-brickW, -brickH + (brickH * 0.5) * perspectiveY);
        ctx.lineTo(-brickW, 0 + (brickH * 0.5) * perspectiveY);
        ctx.moveTo(perspectiveX * brickW * 0.5, 0);
        ctx.fill();
        ctx.closePath();

        //perspective
        if (isFlatBrick && lastRed === 0 && lastGreen === 0 && lastBlue === 0) {
          ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + pixelAlpha * 1 + ')';
          ctx.beginPath();
          ctx.moveTo(-brickW, 0);
          ctx.lineTo(-brickW - 3, 3);
          ctx.lineTo(-brickW - 3, -brickH + 3);
          ctx.lineTo(-brickW, -brickH);
          ctx.moveTo(-brickW, 0);
          ctx.fill();
          ctx.closePath();
        }

        //if( Math.random() > 0.5 && perspectiveY < 0) {
        if (perspectiveY < 0) {

          ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + 1 + ')';
          ctx.beginPath();
          ctx.moveTo(0, -brickH * 1);
          ctx.lineTo(-brickW, -brickH * 1 + brickH * 0.5 * perspectiveY);
          ctx.lineTo(0, -brickH * 1 + (brickH) * perspectiveY);
          ctx.lineTo(brickW, -brickH * 1 + brickH * 0.5 * perspectiveY);
          ctx.moveTo(0, -brickH * 1);
          ctx.fill();
          ctx.closePath();

        }

        if ( isFlatBrick && green > 80 && red < green && blue < green) {
          ctx.fillStyle = 'rgba(' + 0 + ',' + 0 + ',' + 0 + ',' + 0.2 + ')';
          drawEllipse(ctx, -brickW * .5, brickH * -.75, brickW, brickH * 0.5);
          ctx.fill();

          ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + pixelAlpha + ')';
          drawEllipse(ctx, -brickW * .4, brickH * -.8, brickW * 0.9, brickH * 0.4);
          ctx.fill();
        }

        lastRed = red;
        lastGreen = green;
        lastBlue = blue;

        ctx.restore();

      } // col
    } // row
  } // options

};

function drawEllipse(ctx, x, y, w, h) {
  var kappa = .5522848,
  ox = (w / 2) * kappa, // control point offset horizontal
  oy = (h / 2) * kappa, // control point offset vertical
  xe = x + w, // x-end
  ye = y + h, // y-end
  xm = x + w / 2, // x-middle
  ym = y + h / 2; // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  ctx.closePath();
}

//MIT License
//Author: Max Irwin, 2011

//Floodfill functions
function floodfill(x,y,fillcolor,ctx,width,height,tolerance) {
  var img = ctx.getImageData(0,0,width,height);
  var data = img.data;
  var length = data.length;
  var Q = [];
  var i = (x+y*width)*4;
  var e = i, w = i, me, mw, w2 = width*4;
  var targetcolor = [data[i],data[i+1],data[i+2],data[i+3]];
  var targettotal = data[i]+data[i+1]+data[i+2]+data[i+3];

  if(!pixelCompare(i,targetcolor,targettotal,fillcolor,data,length,tolerance)) { return false; }
  Q.push(i);
  while(Q.length) {
    i = Q.pop();
    if(pixelCompareAndSet(i,targetcolor,targettotal,fillcolor,data,length,tolerance)) {
      e = i;
      w = i;
      mw = parseInt(i/w2)*w2; //left bound
      me = mw+w2; //right bound
      while(mw<(w-=4) && pixelCompareAndSet(w,targetcolor,targettotal,fillcolor,data,length,tolerance)); //go left until edge hit
      while(me>(e+=4) && pixelCompareAndSet(e,targetcolor,targettotal,fillcolor,data,length,tolerance)); //go right until edge hit
      for(var j=w;j<e;j+=4) {
        if(j-w2>=0    && pixelCompare(j-w2,targetcolor,targettotal,fillcolor,data,length,tolerance)) Q.push(j-w2); //queue y-1
        if(j+w2<length  && pixelCompare(j+w2,targetcolor,targettotal,fillcolor,data,length,tolerance)) Q.push(j+w2); //queue y+1
      }
    }
  }
  ctx.putImageData(img,0,0);
}

function pixelCompare(i,targetcolor,targettotal,fillcolor,data,length,tolerance) {
  if (i<0||i>=length) return false; //out of bounds
  if (data[i+3]===0)  return true;  //surface is invisible

  if (
    (targetcolor[3] === fillcolor.a) &&
    (targetcolor[0] === fillcolor.r) &&
    (targetcolor[1] === fillcolor.g) &&
    (targetcolor[2] === fillcolor.b)
  ) return false; //target is same as fill

  if (
    (targetcolor[3] === data[i+3]) &&
    (targetcolor[0] === data[i]  ) &&
    (targetcolor[1] === data[i+1]) &&
    (targetcolor[2] === data[i+2])
  ) return true; //target matches surface

  if (
    Math.abs(targetcolor[3] - data[i+3])<=(255-tolerance) &&
    Math.abs(targetcolor[0] - data[i]  )<=tolerance &&
    Math.abs(targetcolor[1] - data[i+1])<=tolerance &&
    Math.abs(targetcolor[2] - data[i+2])<=tolerance
  ) return true; //target to surface within tolerance

  return false; //no match
}

function pixelCompareAndSet(i,targetcolor,targettotal,fillcolor,data,length,tolerance) {
  if(pixelCompare(i,targetcolor,targettotal,fillcolor,data,length,tolerance)) {
    //fill the color
    data[i]    = fillcolor.r;
    data[i+1] = fillcolor.g;
    data[i+2] = fillcolor.b;
    data[i+3] = fillcolor.a;
    return true;
  }
  return false;
}
