'use strict';

var gulp = require('gulp');
var filter = require('gulp-filter');
var cfg = require('../config');
var errorNotif = require('../utils/error-notification');
var wrap = require("gulp-wrap");
var StreamQueue = require('streamqueue');
var jsoncombine = require("gulp-jsoncombine");
var sq = new StreamQueue({ objectMode: true });

var through = require('through'),
    gutil = require('gulp-util'),
    fs = require('fs'),
    path = require('path');

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
};

var partCache = {};
var lastFileIndex = 0;

function searchFiles(opts) {

  opts = opts || {};

  function findDATResources(fileStr) {
    lastFileIndex++
    var loadFiles = [];

    var lines = fileStr.split('\n');

    for (var i=0; i<lines.length; i++)
    {
      var li = lines[i].trim();
      if(li==='') continue;

      if(li.startsWith("0 FILE "))
      {

      }
      else if( li.startsWith("1") )
      {

        var tokens = li.split(/[ \t]+/);

        var partName = tokens.slice(14).join(" ").toLowerCase();

        partName = partName.replace(/\\/gi,"/");

        var p = partCache[partName];
        if(p) {

        }
        else {
          loadFiles.push(partName);
          partCache[partName] = partName;
        }

      }
    }

    return loadFiles;
  }


  var totalFiles = 0;

  return through(function (file) {
      if (!(file.contents instanceof Buffer)) {
        return this.emit('error', new gutil.PluginError('gulp-assets', 'Streams not supported'));
      }

      opts.cwd = file.base;

      var fileContent = String(file.contents),
        currentStream = this,
        filesSrc = [];

      filesSrc = filesSrc.concat(findDATResources(fileContent));

      filesSrc.forEach(function (fileSrc) {

        var filePath = path.join(cfg.ldraw.path, fileSrc);

        totalFiles++
        sq.queue(gulp.src([filePath]));

      });

      if(lastFileIndex>totalFiles) {
        sq.done();
      };

  });
};


gulp.task('ldraw-batch', function() {

  //starting point
  sq.queue(
    gulp.src(cfg.ldraw.path+'minifig.ldr')
  )
    .pipe(gulp.dest(cfg.output.root + '/parts/files'))
    .pipe(searchFiles())

  sq.on('end', function( value ){

    var src = gulp.src(cfg.output.root + '/parts/files/*.*')
      .pipe(wrap('<%= JSON.stringify(contents.toString()) %>'))
      .pipe(jsoncombine('parts.js',function(data){

        var buffer = new Buffer('module.exports =' + JSON.stringify(data));
        return buffer;
      }))
      .pipe(gulp.dest(cfg.output.root + '/parts'))

  })

});
