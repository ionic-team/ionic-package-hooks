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
 *   app.js
 *   app.min.js (contains all app as controllers, services, etc.)
 *
 *
 * Builds a app file minimized which contains all controllers, services, filters, etc.
 * Also minimizes all templates, index.html, images and css.
 */


// Modules
var
 uglifyJsOptions = {
  compress: {
    drop_console: true
  },
  fromString: false
}
,cleanCssOptions = {
  noAdvanced: true,
  keepSpecialComments: 0
}
,imgOptions = {
  jpeg: {
    progressive: true,
    arithmetic: false
  },
  png: {
    optimizationLevel: 2
  },
  gif: {
    interlaced: false
  },
  svg: {
    pretty: false
  }
}
,fs                    = require('fs')
,walk                  = require('walk')
,path                  = require('path')
,cwd                   = process.cwd()
,dependencyPath        = path.join(cwd, 'node_modules', 'cordova-uglify', 'node_modules')

,gulp                  = require('gulp')
,clean                 = require('gulp-clean')

// cordova-uglify module dependencies
,UglifyJS              = require(path.join(dependencyPath, 'uglify-js'))
,CleanCSS              = require(path.join(dependencyPath, 'clean-css'))
,Imagemin              = require(path.join(dependencyPath, 'imagemin'))

// Process
,rootDir               = process.argv[2]
,platformPath          = path.join(rootDir, 'platforms')
,platforms             = process.env.CORDOVA_PLATFORMS.split(',')
,cssMinifier           = new CleanCSS(cleanCssOptions)
,htmlmin               = require('gulp-htmlmin')
,minifyImage           = new MinifyImage(imgOptions);


/* posibles angularjs's folders */
var appFoldersPatt   = /^(js(\.\w+)*)|(app(\.\w+)*)|(templates?(\.\w+)*)|(views?(\.\w+)*)$/i;
var viewsFoldersPatt = /^(templates?(\.\w+)*)|(views?(\.\w+)*)|(directives?(\.\w+)*)$/i;
var cssFoldersPatt   = /^(css(\.\w+)*)$/i;
var imgFoldersPatt   = /^(img)|(images?)$/i;

var appConfigJSPatt  = /^app(\.\w+)*\.js$/i;
var filesAllowedPatt = /^(.+\.js)|(.+\.css)|(.+\.html)|(.+\.jpeg)|(.+\.jpg)|(.+\.png)|(.+\.gif)|(.+\.svg)$/i;


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

    compress(path.join(wwwPath, 'index.html'));

    fs.readdir(wwwPath, function (err, list) {
      if (err) {
        return;
      }

      list.forEach(function (file) {
        var fileName = file;
        file = path.join(wwwPath, fileName);

        fs.stat(file, function (err, stat) {
          if (stat.isDirectory()) {
            if (viewsFoldersPatt.test(fileName)) {
              processFilesSingly(file, /^.+\.html$/i);
            }
            else if (cssFoldersPatt.test(fileName)) {
              processFilesSingly(file, /^.+\.css$/i);
            }
            else if (imgFoldersPatt.test(fileName)) {
              processFilesSingly(file, /^.+\.jpeg/i);
              processFilesSingly(file, /^.+\.jpg/i);
              processFilesSingly(file, /^.+\.png/i);
              processFilesSingly(file, /^.+\.gif/i);
              processFilesSingly(file, /^.+\.svg/i);
            }
            else if (appFoldersPatt.test(fileName)) {
              // folder: js | app | templates | ...
              processFilesSingly(file, /^.+\.html$/i);
              processAppFolder(file, function(appFiles, alreadyCompressed) {
                processFiles2UniqFile(file, /^.+\.js$/, path.join(file, fileName + '.min.js'), appFiles, alreadyCompressed);
              });
            }
          }
        });
      });
    });
  });
}

function processAppFolder(appPath, callback) {
  var appFiles = [];
  var others = [];

  fs.readdir(appPath, function (err, list) {
    if (err) {
      return;
    }

    list.forEach(function (file, index) {
      var fileName = file;
      file = path.join(appPath, fileName);

      fs.stat(file, function (err, stat) {
        if (stat.isFile()) {
          if (appConfigJSPatt.test(fileName)) {
            appFiles.push(file);
          }
          else if (filesAllowedPatt.test(fileName)) {
            others.push(file);
            compress(file);
          }
        }

        if (index == list.length - 1) {
          appFiles.sort();
          callback(appFiles, others);
        }
      });
    });
  });
}

function processFilesSingly(source, typePatt) {
  fs.readdir(source, function (err, list) {
    if (err) {
      console.log('UGLIFY > Function[processFiles][err]: ' + err);
      return;
    }

    list.forEach(function (file) {
      var fileName = file;
      file = path.join(source, fileName);

      fs.stat(file, function (err, stat) {
        if (stat.isFile()) {
          if (typePatt.test(fileName)) {
            compress(file);
          }
        }
        else {
          processFilesSingly(file, typePatt);
        }
      });
    });
  });
}

function processFiles2UniqFile(source, typePatt, target, toInclude, toIgnore) {
  var
   files = []
  ,counter = 0
  ,folders = (typeof source == "object") ? source : [ source ];

  folders.forEach(function(folder) {
    walk.walk(folder, {followLinks: false})
      .on('file', function (root, stat, next) {
        if (typePatt.test(stat.name)) {
          var file = path.join(root, stat.name);
          if ((!toInclude || toInclude.indexOf(file) < 0) && (!toIgnore || toIgnore.indexOf(file) == -1)) {
            files.push(file);
          }
        }

        next();
      }).on('end', function () {
        counter++;

        if (counter === folders.length) {
          if (!toInclude) {
            compress(files, target);
          }
          else {
            compress(toInclude.concat(files), target);
          }
        }
      });
  });
}

/**
 * Compresses file.
 *
 * @param  {string} source - File|Array files
 * @param {string} minFile
 */
function compress(source, minFile) {
  var
   ext = ''
  ,target = minFile || source
  ,code
  ,result;

  if (typeof source == 'object' && source.length) {
    ext = path.extname(source[0]);
  }
  else {
    ext = path.extname(source);
  }

  if (typeof target !== "string") {
    console.log('UGLIFY > ERR: target type undefined');
    exit(0);
  }

  switch (ext) {
    case '.js':
      console.log('UGLIFY > JS: ' + target);

      source = (typeof source == 'object') ? getCleanFiles(source, 'js') : source;
      result = UglifyJS.minify(source, uglifyJsOptions);
      fs.writeFileSync(target, result.code, 'utf8'); // overwrite the original unminified file
      break;

    case '.css':
      console.log('UGLIFY > CSS: ' + target);

      code = fs.readFileSync(source, 'utf8');
      result = cssMinifier.minify(code);
      fs.writeFileSync(target, result.styles, 'utf8'); // overwrite the original unminified file
      break;

    case '.jpeg':
    case '.jpg':
      console.log('UGLIFY > JPEG: ' + target);

      minifyImage.minify(target, minifyImage.JPEG);
      break;

    case '.png':
      console.log('UGLIFY > PNG: ' + target);

      minifyImage.minify(target, minifyImage.PNG);
      break;

    case '.gif':
      console.log('UGLIFY > GIF: ' + target);

      minifyImage.minify(target, minifyImage.GIF);
      break;

    case '.svg':
      console.log('UGLIFY > SVG: ' + target);

      minifyImage.minify(target, minifyImage.SVG);
      break;

    case '.html':
      console.log('UGLIFY > HTML: ' + target);

      var pathPattern = /^(.*)\/([^\/]*)$/;
      //var file = cleanFiles[i].replace(pathPattern, '$2');
      var pathFile = target.replace(pathPattern, '$1');

      gulp.src(source)
        .pipe(htmlmin({collapseWhitespace: true, removeComments: true}))
        .pipe(gulp.dest(pathFile));
      break;

    default:
      console.log('UGLIFY > encountered a ' + ext + ' file, not compressing it');
      break;
  }
}

/*
 * Helpers
 */

/**
 * Constructor
 *
 * @param {object} config - The hook config of image
 * @return {object} - MinifyImage instance
 */
function MinifyImage(config) {
  this.config = config || {};
  this.JPEG = 'JPEG';
  this.PNG = 'PNG';
  this.GIF = 'GIF';
  this.SVG = 'SVG';
  this.minify = minify;

  var that = this;

  /**
   * @param {string} file   - File path
   * @param {string} format - Image format
   * @return {undefined}
   * {@link https://github.com/imagemin/imagemin imagemin}
   */
  function minify(file, format) {
    switch (format) {
      case that.JPEG:
        new Imagemin()
          .src(file)
          .dest(path.dirname(file))
          .use(Imagemin.jpegtran(that.config.jpeg))
          .run(errorHandler);
        break;

      case that.PNG:
        new Imagemin()
          .src(file)
          .dest(path.dirname(file))
          .use(Imagemin.optipng(that.config.png))
          .run(errorHandler);
        break;

      case that.GIF:
        new Imagemin()
          .src(file)
          .dest(path.dirname(file))
          .use(Imagemin.gifsicle(that.config.gif))
          .run(errorHandler);
        break;

      case that.SVG:
        new Imagemin()
          .src(file)
          .dest(path.dirname(file))
          .use(Imagemin.svgo(that.config.svg))
          .run(errorHandler);
        break;

      default:
        console.log('encountered a ' + format + ' image, not compressing it');
        break;
    }

    // Error handler
    function errorHandler(err) {
      if (!err) {
        return;
      }

      console.error('Fail to minify image ' + file + ': ' + err);
    }
  }
}

function getCleanFiles(files, type) {
  var cleanFiles = [];
  for (var i in files) {
    if ( files[i].indexOf('.' + type) > -1 && files[i].indexOf('.min.'+type) === -1 ) {
      cleanFiles.push(files[i]);
    }
  }

  return cleanFiles;
}
