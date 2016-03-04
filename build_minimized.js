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


// Settings and modules
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


/* Angularjs's folders posibles */
var appFoldersPatt   = /^(js(\.\w+)*)|(app(\.\w+)*)|(templates?(\.\w+)*)|(views?(\.\w+)*)$/i;
var viewsFoldersPatt = /^(partials?(\.\w+)*)|(templates?(\.\w+)*)|(views?(\.\w+)*)|(directives?(\.\w+)*)$/i;
var cssFoldersPatt   = /^(css(\.\w+)*)|(assets)$/i;
var imgFoldersPatt   = /^(img)|(images?)|(assets)$/i;

var initJSPatt       = /^(app(\.\w+)*\.js)|(controllers?(\.\w+)*\.js)|(directives?(\.\w+)*\.js)|(filters?(\.\w+)*\.js)|(factories(\.\w+)*\.js)$/i; // app.js | app.routes.js | app.config.js | app.modules.js ...

var wwwPath;

// Run uglifier
run();

/**
 * Run compression for all specified platforms.
 * @return {undefined}
 */
function run() {
  platforms.forEach(function(platform) {
    switch (platform) {
      case 'android':
        wwwPath = path.join(platformPath, platform, 'assets', 'www'); // platform/android/assets/www
        break;
      default:
        wwwPath = path.join(platformPath, platform, 'www'); // platform/ios/www
        break;
    }

    var indexPath = path.join(wwwPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return;
    }

    compress(indexPath, indexPath, function() {
      // tracking each subfolder of www
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
                processFiles2UniqFile(file, /^.+\.css$/i, path.join(file, fileName + '.min.css'), [], [], updateIndex);
              }
              else if (imgFoldersPatt.test(fileName)) {
                processFilesSingly(file, /^(.+\.jpeg)|(.+\.jpg)|(.+\.png)|(.+\.gif)|(.+\.svg)$/i);
              }
              else if (appFoldersPatt.test(fileName)) {
                // folder: js | app | templates | ...
                processFilesSingly(file, /^.+\.html$/i);
                processAppFolder(file, function(appFiles, minimized) {
                  processFiles2UniqFile(file, /^.+\.js$/, path.join(file, fileName + '.min.js'), appFiles, minimized,  function(result) {
                    updateIndex(result);
                    (new GarbageCollector()).processFolder(file, true);
                  });
                });
              }
            }
          });
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
          if (initJSPatt.test(fileName)) {
            appFiles.push(file);
          }
          else if (/^(.+\.js)$/i.test(fileName)) {
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

/**
 * Reads and minimizes each file on the source individually.
 *
 * @param {string|Array} source
 * @param {RegExp} typePatt
 * @param {function} done
 */
function processFilesSingly(source, typePatt, done) {
  var
   result = []
  ,counter = 0
  ,folders = (typeof source == "object") ? source : [ source ];

  folders.forEach(function(folder) {
    walk.walk(folder, {followLinks: false})
      .on('file', function (root, stat, next) {
        if (typePatt.test(stat.name)) {
          var file = path.join(root, stat.name);
          compress(file);
          result.push({
             target: file
            ,source: [ file ]
          });
        }

        next();
      }).on("errors", function (root, nodeStatsArray, next) {
        next();
      }).on('end', function () {
        counter++;

        if (done) {
          done(result);
        }
      });
  });
}

/**
 * Reads and minimizes each file into a unique file.
 *
 * @param {string|Array} source
 * @param {RegExp} typePatt
 * @param {string} target   - result file with source files minimized
 * @param {Array} toInclude - includes those files in the minimizer process
 * @param {Array} toIgnore  - ignore those files in the minimizer process
 * @param {function} done
 */
function processFiles2UniqFile(source, typePatt, target, toInclude, toIgnore, done) {
  var
   files = []
  ,counter = 0
  ,folders = (typeof source == "object") ? source : [ source ]
  ,result = [];

  folders.forEach(function(folder) {
    walk.walk(folder, {followLinks: false})
      .on('file', function (root, stat, next) {
        if (typePatt.test(stat.name)) {
          var file = path.join(root, stat.name);
          if ((!toInclude || toInclude.indexOf(file) < 0) && (!toIgnore || toIgnore.indexOf(file) < 0)) {
            files.push(file);
          }
        }

        next();
      }).on("errors", function (root, nodeStatsArray, next) {
        next();
      }).on('end', function () {
        counter++;

        if (counter === folders.length) {
          var tocompress = !toInclude ? files : toInclude.concat(files);

          if (tocompress && tocompress.length) {
            result.push({
               target: target
              ,source: tocompress
            });

            compress(getUniqueFiles( tocompress ), target, function() { done(result); });
          }
          else if (done) {
            done(result);
          }
        }
      });
  });
}

/**
 * Compresses file or files array.
 *
 * @param {string|Array} source - file|files array
 * @param {string} minFile
 */
function compress(source, minFile, done) {
  var
   ext = ''
  ,target = minFile || source
  ,result;

  if (typeof source == 'object' && source.length) {
    ext = path.extname(source[0]);
  }
  else {
    ext = path.extname(source);
  }

  if (typeof target !== "string") {
    process.stdout.write('MINIMIZE > ERR: target type undefined\n');
  }

  switch (ext) {
    case '.js':
      process.stdout.write('MINIMIZE > JS: ' + target + '\n');

      result = UglifyJS.minify(source, uglifyJsOptions);
      fs.writeFileSync(target, result.code, 'utf8'); // overwrite the original unminified file
      if (done) done();
      break;

    case '.css':
      process.stdout.write('MINIMIZE > CSS: ' + target + '\n');
      var list, code = '';

      list = (typeof source == 'object') ? source : [ source ];
      code = '';
      list.forEach(function(file) {
        code += fs.readFileSync(file, 'utf8');
      });

      result = cssMinifier.minify(code);
      fs.writeFileSync(target, result.styles, 'utf8'); // overwrite the original unminified file
      if (done) done();
      break;

    case '.jpeg':
    case '.jpg':
      process.stdout.write('MINIMIZE > JPEG: ' + target + '\n');

      minifyImage.minify(target, minifyImage.JPEG);
      if (done) done();
      break;

    case '.png':
      process.stdout.write('MINIMIZE > PNG: ' + target + '\n');

      minifyImage.minify(target, minifyImage.PNG);
      if (done) done();
      break;

    case '.gif':
      process.stdout.write('MINIMIZE > GIF: ' + target + '\n');

      minifyImage.minify(target, minifyImage.GIF);
      if (done) done();
      break;

    case '.svg':
      process.stdout.write('MINIMIZE > SVG: ' + target + '\n');

      minifyImage.minify(target, minifyImage.SVG);
      if (done) done();
      break;

    case '.html':
      process.stdout.write('MINIMIZE > HTML: ' + target + '\n');

      var pathPattern = /^(.*)\/([^\/]*)$/;
      //var file = cleanFiles[i].replace(pathPattern, '$2');
      var pathFile = target.replace(pathPattern, '$1');

      gulp.src(source)
        .pipe(htmlmin({collapseWhitespace: true, removeComments: true}))
        .pipe(gulp.dest(pathFile))
        .on('end', function() { if (done) done(); });
      break;

    default:
      process.stdout.write('MINIMIZE > encountered a ' + ext + ' file, not compressing it\n');
      break;
  }
}

/**
 * Updates the index with minimize result.
 *
 * @param {Array} result - contains items with source and target maps.
 */
function updateIndex(result) {
  if (!result || !result.length) {
    return;
  }

  try {
    var indexPath = path.join(wwwPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      var html = fs.readFileSync(indexPath, 'utf8');

      result.forEach(function (item) {
        var type = null, replaced = false;

        if (/^.+\.js$/i.test(item.target)) {
          type = 'js';
        }
        else if (/^.+\.css$/i.test(item.target)) {
          type = 'css';
        }

        if (['js', 'css'].indexOf(type) > -1) {
          item.source.forEach(function (source) {
            // relative routes
            var fsource = source.replace(wwwPath + '/', '').trim();
            var ftarget = item.target.replace(wwwPath + '/', '').trim();

            if (!replaced && html.indexOf(fsource) > -1) {
              html = html.replace(fsource, ftarget);
              replaced = true;
            }
            else {
              switch (type) {
                case 'js':
                  html = html.replace(new RegExp('<script\\s[^>]*' + fsource + '[^>]*>\\s*<\\/script\\s*>', 'i'), '');
                  break;
                case 'css':
                  html = html.replace(new RegExp('<link\\s[^>]*' + fsource + '[^>]*>', 'i'), '');
                  break;
              }
            }
          });
        }
      });

      fs.writeFileSync(indexPath, html, 'utf8');
      process.stdout.write('MINIMIZE > index.html updated\n');
    }
  }
  catch (err) {
    process.stdout.write('MINIMIZE > Update index.html err: ' + err + '\n');
  }
}

/*
 * Helpers
 */

/**
 * Given a file list the function removes duplicate files (min files).
 *
 * @param {string} files
 * @return {Array}
 */
function getUniqueFiles(files) {
  if (!files || !files.length) {
    return files;
  }

  var newArray = files.slice();
  var length = newArray.length;
  var extension = path.extname(files[0]);

  for (var i = length - 1; i >= 0; i--) {
    var fName = getFileName(newArray[i]);
    var minPatt = new RegExp('^.+\.min' + extension + '$', 'i');

    if ( minPatt.test(newArray[i]) && newArray.indexOf( fName + extension ) > -1 ) {
      newArray.splice(i, 1);
    }
  }

  return newArray;
}

/**
 * Get file without extension and 'min' tag.
 *
 * @example
 *  file: app.min.js
 *  return: app
 *
 * @param {string} file
 * @return {string} file name
 */
function getFileName(file) {
  var extension = path.extname(file);
  var minPatt = new RegExp('^(.+)\.min' + extension + '$', 'i');
  var noMinPatt = new RegExp('^(.+)' + extension + '$', 'i');
  var matchs = minPatt.test(file)
    ? minPatt.exec(file)
    : noMinPatt.exec(file);

  return matchs[1];
}


/**
 * Constructor
 *
 * @param {object} config - The hook config of image
 * @return {object} MinifyImage instance
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


function GarbageCollector() {
}
GarbageCollector.prototype = {
  processFolder: function(source, isRoot) {
    var $this = this;

    fs.readdir(source, function (err, list) {
      if (err) {
        process.stdout.write('GarbageCollector > Function[processFiles][err]: ' + err + '\n');
        return;
      }

      list.forEach(function (file) {
        var fileName = file;
        file = path.join(source, fileName);

        fs.stat(file, function (err, stat) {
          if (stat.isFile()) {
            $this.processFile(file, isRoot);
          }
          else if ( viewsFoldersPatt.test(fileName) ) {
            $this.processFolder(file, false);
          }
          else if (isRoot) {
            $this.deleteFolderRecursive(file);
          }
        });
      });
    });
  },

  /**
   * Removes directory.
   *
   * @param source
   */
  deleteFolderRecursive: function(source) {
    var $this = this;

    if ( fs.existsSync(source) ) {
      var files = fs.readdirSync(source);

      files.forEach(function(file) {
        var curPath = path.join( source, file );
        if (fs.statSync(curPath).isDirectory()) {
          $this.deleteFolderRecursive(curPath);
        }
        else {
          $this.processFile(curPath, false);
        }
      });

      try {
        fs.rmdirSync(source);
        process.stdout.write('GarbageCollector > folder ' + source + '\n');
      }
      catch (exception) {
        // dir not empty
      }
    }
  },

  /**
   * Tries remove file if isn't minimized.
   *
   * @param file
   * @param {bool} isRoot - if is app root folder ('app' or 'js' folder)
   */
  processFile: function(file, isRoot) {
    var fileName = path.basename(file);

    // if not min js or html
    if (!/^(.+\.(min)\.js)|(.+\.html)$/i.test(fileName)) {
      if (/^.*\.js$/i.test(fileName)) {

        if (isRoot && !initJSPatt.test(fileName)) {
          var match = /^(.*)(\.js)$/i.exec(fileName);
          if (match != null) {
            var minFileName = match[1] + '.min.js';

            try {
              // only remove if exists a min file version
              fs.statSync(path.join(path.dirname(file), minFileName));
              process.stdout.write('GarbageCollector > file ' + fileName + '\n');
              fs.unlinkSync(file);
            }
            catch (execption) {
              // no exist min file version
            }
          }
        }
        else {
          process.stdout.write('GarbageCollector > file ' + fileName + '\n');
          fs.unlinkSync(file);
        }
      }
      else {
        process.stdout.write('GarbageCollector > file ' + fileName + '\n');
        fs.unlinkSync(file);
      }
    }
  }
};
