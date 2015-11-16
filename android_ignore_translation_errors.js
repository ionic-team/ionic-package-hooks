#!/usr/bin/env node

// add additional build-extras.gradle file to instruct android's lint to ignore translation errors
// v0.1.c
// causing error in the build --release
// Issue: https://github.com/phonegap/phonegap-plugin-barcodescanner/issues/80
//
// Warning: This solution does not solve the problem only makes it possible to build --release

var fs = require('fs');

var rootdir = process.argv[2];


if(rootdir){
	
	var platforms = (process.env.CORDOVA_PLATFORMS ? process.env.CORDOVA_PLATFORMS.split(',') : []);
	for(var x = 0; x < platforms.length; x++){
		var platform = platforms[x].trim().toLowerCase();
		try{
			if(platform == 'android'){
				var lintOptions = 'android { \nlintOptions {\ndisable \'MissingTranslation\' \ndisable \'ExtraTranslation\' \n} \n}';
				fs.appendFileSync('platforms/android/build-extras.gradle', lintOptions, 'UTF-8');
				process.stdout.write('Added build-extras.gradle ');
			}
		}catch(e){
			process.stdout.write(e);
		}
	}
}
