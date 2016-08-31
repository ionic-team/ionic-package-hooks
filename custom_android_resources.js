#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

var platformDir = 'platforms/android';
var source = 'resources/android/custom/';
var resourceDirs = [
  'res/drawable-ldpi-v4/',
  'res/drawable-mdpi-v4/',
  'res/drawable-hdpi-v4/',
  'res/drawable-xhdpi-v4/',
  'res/drawable-xxhdpi-v4/',
  'res/drawable-xxxhdpi-v4/',
  'res/drawable-ldpi/',
  'res/drawable-mdpi/',
  'res/drawable-hdpi/',
  'res/drawable-xhdpi/',
  'res/drawable-xxhdpi/',
  'res/drawable-xxxhdpi/'
];

function copy(src, dest, file) {
  var deferred = Q.defer();

  if (fs.existsSync(src) && fs.existsSync(dest)) {
    deferred.resolve(fs.createReadStream(src).pipe(fs.createWriteStream(path.join(dest, file))));
  } else {
    deferred.resolve();
  }

  return deferred.promise;
}

module.exports = function(ctx) {
  if (ctx.opts.platforms.indexOf('android') < 0) {
    return;
  }

  var Q = ctx.requireCordovaModule('q');
  var deferred = Q.defer();
  var androidPlatformDir = path.join(ctx.opts.projectRoot, platformDir);

  fs.readdir(path.join(ctx.opts.projectRoot, source), function(err, files) {
    files.forEach(function(file) {
      resourceDirs.forEach(function(destination) {
        return copy(path.join(ctx.opts.projectRoot, source + file), path.join(androidPlatformDir, destination), file);
      });
    });
  });

  return deferred.promise;
}
