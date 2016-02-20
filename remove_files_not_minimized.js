#!/usr/bin/env node

/**
 * In a typical angularJS scaffolding ...
 * ---------------------------------
 * app | js
 *   controllers
 *      HomeController.js
 *   directives
 *      ...
 *   factories
 *      ...
 *   ...
 *   app.js
 *
 *
 * After minimize ...
 * ---------------------------------
 *
 * app | js
 *   controllers
 *      HomeController.js
 *   directives
 *      ...
 *   factories
 *      ...
 *   ...
 *   app.min.js (contains all app as controllers, services, etc.)
 *
 *
 * Removes unnecessary folders (controllers, directives, ...) except view's folder and scripts minimized
 * in root folder.
 */

// Modules
var
 fs                    = require('fs')
,path                  = require('path')

// Process
,rootDir               = process.argv[2]
,platformPath          = path.join(rootDir, 'platforms')
,platforms             = process.env.CORDOVA_PLATFORMS.split(',');


/* posibles angularjs's folders */
var appFoldersPatt  = /^(js(\.\w+)*)|(app(\.\w+)*)$/i;
var viewsFolderPatt = /^(templates?(\.\w+)*)|(views?(\.\w+)*)|(directives?(\.\w+)*)$/i;
var minPatt         = /^(.+\.(min)\.js)|(.+\.html)$/i;

var appConfigJSPatt = /^app(\.\w+)*\.js$/i;

// Run uglifier
run();

/**
 * Run compression for all specified platforms.
 * @return {undefined}
 */
function run() {
  platforms.forEach(function(platform) {
    var wwwPath;

    switch (platform) {
      case 'android':
        wwwPath = path.join(platformPath, platform, 'assets', 'www'); // platform/android/assets/www
        break;

      case 'ios':
      case 'browser':
      case 'wp8':
        wwwPath = path.join(platformPath, platform, 'www'); // platform/ios/www
        break;

      default:
        console.log('this hook only supports android, ios, wp8, and browser currently');
        return;
    }

    fs.readdir(wwwPath, function (err, list) {
      if (err) {
        return;
      }

      list.forEach(function (file) {
        var fileName = file;
        file = path.join(wwwPath, fileName);

        fs.stat(file, function (err, stat) {
          if (stat.isDirectory()) {
            if (appFoldersPatt.test(fileName)) {
              processFolder(file, true);
            }
          }
        });
      });
    });
  });
}

function processFolder(source, isRoot) {
  fs.readdir(source, function (err, list) {
    if (err) {
      console.log('CLEAR > Function[processFiles][err]: ' + err);
      return;
    }

    list.forEach(function (file) {
      var fileName = file;
      file = path.join(source, fileName);

      fs.stat(file, function (err, stat) {
        if (stat.isFile()) {
          processFile(file, isRoot);
        }
        else if ( viewsFolderPatt.test(fileName) ) {
          processFolder(file, false);
        }
        else if (isRoot) {
          deleteFolderRecursive(file);
        }
      });
    });
  });
}

function deleteFolderRecursive(source) {
  if ( fs.existsSync(source) ) {
    var files = fs.readdirSync(source);

    files.forEach(function(file) {
      var curPath = path.join( source, file );
      if (fs.statSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      }
      else {
        processFile(curPath, false);
      }
    });

    try {
      fs.rmdirSync(source);
      console.log('CLEAR > folder ' + source);
    }
    catch (exception) {
      // dir not empty
    }
  }
}

function processFile(file, isRoot) {
  var fileName = path.basename(file);

  // if not min js or html
  if (!minPatt.test(fileName)) {
    if (/^.*\.js$/i.test(fileName)) {

      if (isRoot && !appConfigJSPatt.test(fileName)) {
        var match = /^(.*)(\.js)$/i.exec(fileName);
        if (match != null) {
          var minFileName = match[1] + '.min.js';

          try {
            // only remove if exists a min file version
            fs.statSync(path.join(path.dirname(file), minFileName));
            console.log('CLEAR > file ' + fileName);
            fs.unlinkSync(file);
          }
          catch (execption) {
            // no exist min file version
          }
        }
      }
      else {
        console.log('CLEAR > file ' + fileName);
        fs.unlinkSync(file);
      }
    }
    else {
      console.log('CLEAR > file ' + fileName);
      fs.unlinkSync(file);
    }
  }
}
