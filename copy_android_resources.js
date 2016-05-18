#!/usr/bin/env node

var source = "resources/android/custom/";
var destinations = ["platforms/android/res/drawable-ldpi/",
        "platforms/android/res/drawable-mdpi/",
        "platforms/android/res/drawable-hdpi/",
        "platforms/android/res/drawable-xhdpi/",
        "platforms/android/res/drawable-xxhdpi/",
        "platforms/android/res/drawable-xxxhdpi/"];

var fs = require('fs');
var path = require('path');

var rootdir = process.argv[2];

fs.readdir(path.join(rootdir, source), function(err, files){
    files.forEach(function(file){
        destinations.forEach(function(destination){
            copy(source + file, destination + file);
        });
    })
});

function copy(src, dest){
    var srcfile = path.join(rootdir, src);
    var destfile = path.join(rootdir, dest);
    var destdir = path.dirname(destfile);
    if (fs.existsSync(srcfile) && fs.existsSync(destdir)) {
        fs.createReadStream(srcfile).pipe(
           fs.createWriteStream(destfile));
    }
}