

// add additional build-extras.gradle file to instruct android's lint to ignore translation errors
// v0.1.c
// causing error in the build --release
// Issue: https://github.com/phonegap/phonegap-plugin-barcodescanner/issues/80
//
// Warning: This solution does not solve the problem only makes it possible to build --release
module.exports = function(ctx){
	// make sure android platform is part of build 
	if(ctx.opts.platforms.indexOf('android') < 0){
		return;
	}
	var fs = ctx.requireCordovaModule('fs'),
        path = ctx.requireCordovaModule('path'),
        deferral = ctx.requireCordovaModule('q').defer();
	
	var rootdir = path.join(ctx.opts.projectRoot, 'platforms/android');
	
	
	if(rootdir){
		
		var platforms = ctx.opts.platforms;
		for(var x = 0; x < platforms.length; x++){
			var platform = platforms[x].trim().toLowerCase();
			try{
				if(platform == 'android'){
					var lintOptions = 'android { \nlintOptions {\ndisable \'MissingTranslation\' \ndisable \'ExtraTranslation\' \n} \n}';
					fs.appendFileSync('platforms/android/build-extras.gradle', lintOptions, 'UTF-8');
					console.log('Added build-extras.gradle ');
					deferral.resolve();
				}
			}
			catch(e){
				console.log(e);
			}
		}
	}
	return deferral.promise;
};