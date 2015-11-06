#!/usr/bin/env node

// Remove Folder Values of Plugin: phonegap-plugin-barcodescanner 
// v0.1.a
// Remove the folder values created by phonegap-plugin-plugin-barcodescanner 
// causing error in the build --release
// Issue: https://github.com/phonegap/phonegap-plugin-barcodescanner/issues/80
//
// Warning: This solution does not solve the problem only makes it possible to build --release

var fs = require('fs');
var path = require('path');

var rootdir = process.argv[2];


if (rootdir) {

    var platforms = (process.env.CORDOVA_PLATFORMS ? process.env.CORDOVA_PLATFORMS.split(',') : []);
    for(var x=0; x<platforms.length; x++) {
        var platform = platforms[x].trim().toLowerCase();
        if (platform == 'android') {
            var exec = require('child_process').exec,child;
            child = exec('rm -rf platforms/android/res/values-*',function(err,out) {
                console.log(out); err && console.log(err);
            });
            process.stdout.write('removed folder values of barcodescanner: '+ '\n');
        }
    }
}
