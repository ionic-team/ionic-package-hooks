#!/usr/bin/env node

var source = "resources/android/custom/";
var android_dests = [
  "res/drawable-ldpi-v4/",
  "res/drawable-mdpi-v4/",
  "res/drawable-hdpi-v4/",
  "res/drawable-xhdpi-v4/",
  "res/drawable-xxhdpi-v4/",
  "res/drawable-xxxhdpi-v4/",
  "res/drawable-ldpi/",
  "res/drawable-mdpi/",
  "res/drawable-hdpi/",
  "res/drawable-xhdpi/",
  "res/drawable-xxhdpi/",
  "res/drawable-xxxhdpi/"
];


module.exports = function(ctx) {
  if (ctx.opts.platforms.indexOf('android') < 0) {
    return;
  }

  var fs = ctx.requireCordovaModule('fs');
  var path = ctx.requireCordovaModule('path');
  var Q = ctx.requireCordovaModule('q');

  var android_rootdir = path.join(ctx.opts.projectRoot, 'platforms/android');

  function copy(src, dest_dir, file) {
    var deferred = Q.defer();

    if (fs.existsSync(src) && fs.existsSync(dest_dir)) {
      deferred.resolve(fs.createReadStream(src).pipe(fs.createWriteStream(path.join(dest_dir, file))));
    } else {
      deferred.resolve();
    }

    return deferred.promise;
  }

  var promise = Q(-1);

  fs.readdir(path.join(ctx.opts.projectRoot, source), function(err, files) {
    files.forEach(function(file) {
      android_dests.forEach(function(destination) {
        return copy(path.join(ctx.opts.projectRoot, source + file), path.join(android_rootdir, destination), file);
      });
    });
  });

  return promise;
}
