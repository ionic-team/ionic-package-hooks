// This plugin removes armv7s architecture from build architectures for ios
// solves issues with cordova-plugin-facebook4 which has removed armv7s architecture from its SDK (iOS Facebook SDK v4.6.0)

var fs = require('fs');

var rootdir = process.argv[2];

if (rootdir) {

  // go through each of the platform directories that have been prepared
  var platforms = (process.env.CORDOVA_PLATFORMS ? process.env.CORDOVA_PLATFORMS.split(',') : []);

  for(var x=0; x<platforms.length; x++) {
    // open up the index.html file at the www root
    try {
      var platform = platforms[x].trim().toLowerCase();
      var indexPath;

      if(platform == 'ios') {
        indexPath = path.join('platforms', platform, 'cordova', 'lib', 'build.js');

        if(fs.existsSync(indexPath)) {
          fs.readFile(indexPath, 'utf8', function (err,data) {
            if (err) {
              return console.log(err);
            }
            var result = data.replace(/armv7s/g, '');

            fs.writeFile(indexPath, result, 'utf8', function (err) {
               if (err) return console.log(err);
            });
          });
        }
      }

    } catch(e) {
      process.stdout.write(e);
    }
  }

}
