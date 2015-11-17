// add additional build-extras.gradle file to instruct android's lint to ignore translation errors
// v0.2.0
// New version is a compatible Node module and only appends/write to file if it is 
// empty or does not exist.
// causing error in the build --release
// Issue: https://github.com/phonegap/phonegap-plugin-barcodescanner/issues/80
//
// Warning: This solution does not solve the problem only makes it possible to build --release

function handleErr(err, defer){
	console.log('ERR : '+err);
	return defer.reject(err);
}
function cb(err, data){
	if(err){
		handleErr(err, promise);
	}
	console.log('Successfully added/updated build-extra.gradle');
	return data;
}


module.exports = ignoreTranslationErrors;

function ignoreTranslationErrors(ctx){
	if(ctx.opts.platforms.indexOf('android') < 0){
		return;
	}
	var fs       = ctx.requireCordovaModule('fs'),
		path     = ctx.requireCordovaModule('path'),
		deferral = ctx.requireCordovaModule('q').defer();
	
	var rootdir = path.join(ctx.opts.projectRoot, 'platforms/android');
	
	//
	// Partial file appending still doesn't work. 
	// Needs some tweaking to append the lintOptions 
	// within the actual android{ lintOptions{}} Objects
	//
	function appendFile(data, file, promise){
		
		var hasMissingTranslation = (data.indexOf('disable \'MissingTranslation\'') > -1);
		var hasExtraTranslation = (data.indexOf('disable \'ExtraTranslation\'') > -1);
		var lintOptions = 'android { \nlintOptions {\ndisable \'MissingTranslation\' \ndisable \'ExtraTranslation\' \n} \n}';
		var write;
		if(!hasMissingTranslation && !hasExtraTranslation){
			write = fs.appendFile(file, lintOptions, 'UTF-8', cb);
		}
		else if(!hasMissingTranslation && hasExtraTranslation){
			lintOptions = 'android { \nlintOptions {\ndisable \'MissingTranslation\' \n} \n}';
			//write = fs.appendFile(file, lintOptions, 'UTF-8', cb);
		}
		else if(hasMissingTranslation && !hasExtraTranslation){
			lintOptions = 'android { \nlintOptions {\ndisable \'ExtraTranslation\' \n} \n}';
			//write = fs.appendFile(file, lintOptions, 'UTF-8', cb);
		}
		else{
			console.log('SKIPPING : File already exists and contains exception settings.');
		}
		return promise.resolve(write);
	}
	
	function writeFile(file, promise){
		var lintOptions = 'android { \nlintOptions {\ndisable \'MissingTranslation\' \ndisable \'ExtraTranslation\' \n} \n}';
		var write = fs.appendFile(file, lintOptions, 'UTF-8', cb);
		return promise.resolve(write);
	}
	
	if(rootdir){
		var platforms = ctx.opts.platforms;
		for(var x = 0; x < platforms.length; x++){
			var platform = platforms[x].trim().toLowerCase();
			try{
				if(platform == 'android'){
					
					fs.stat('platforms/android/build-extras.gradle', function(err, stat){
						if(err){
							console.log('File does not exist yet. Adding build-extra.gradle...');
							return writeFile('platforms/android/build-extras.gradle',deferral);
						}
						if(stat && stat.isFile()){
							console.log('File exists. Reading build-extra.gradle...');
							return fs.readFile('platforms/android/build-extras.gradle','UTF-8',function(err,data){
								console.log('Appending build-extra.gradle...');
								return appendFile(data, 'platforms/android/build-extras.gradle', deferral);
							});
						}
					});
				}
			}
			catch(e){
				handleErr(e,deferral);
				console.log(e);
			}
		}
	}
	return deferral.promise;
}