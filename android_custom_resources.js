var fs = require('fs');
var path = require('path');

var sourceDir = 'resources/android/custom';
var platformDir = 'platforms/android';
var resourceDirs = [
  'res/drawable-ldpi',
  'res/drawable-mdpi',
  'res/drawable-hdpi',
  'res/drawable-xhdpi',
  'res/drawable-xxhdpi',
  'res/drawable-xxxhdpi'
];

module.exports = function(ctx) {
  if (ctx.opts.platforms.indexOf('android') < 0) {
    return;
  }

  var Q = ctx.requireCordovaModule('q');
  var deferred = Q.defer();
  var androidPlatformDir = path.join(ctx.opts.projectRoot, platformDir);
  var customResourcesDir = path.join(ctx.opts.projectRoot, sourceDir);

  function copy(src, dest) {
    var deferred = Q.defer();

    fs.stat(src, function(err, stats) {
      if (err || !stats.isFile()) {
        return deferred.reject(err);
      }

      fs.stat(path.dirname(dest), function(err, stats) {
        if (err || !stats.isDirectory()) {
          return deferred.reject(err);
        }

        var rs = fs.createReadStream(src);

        rs.on('error', function(err) {
          console.error(err.stack);
          deferred.reject(err);
        });

        var ws = fs.createWriteStream(dest);

        ws.on('error', function(err) {
          console.error(err.stack);
          deferred.reject(err);
        });

        ws.on('close', function() {
          deferred.resolve();
        });

        rs.pipe(ws);
      });
    });

    return deferred.promise;
  }

  fs.stat(customResourcesDir, function(err, stats) {
    if (err || !stats.isDirectory()) {
      return deferred.resolve();
    }

    fs.readdir(customResourcesDir, function(err, files) {
      var copies = [];

      for (var i in files) {
        for (var j in resourceDirs) {
          var filePath = path.join(ctx.opts.projectRoot, sourceDir, files[i]);
          var destPath = path.join(androidPlatformDir, resourceDirs[j], files[i]);

          copies.push([filePath, destPath]);
        }
      }

      copies.map(function(args) {
        return copy.apply(copy, args);
      });

      Q.all(copies).then(function(r) {
        deferred.resolve();
      }, function(err) {
        console.error(err.stack);
        deferred.reject(err);
      });
    });
  });

  return deferred.promise;
}
