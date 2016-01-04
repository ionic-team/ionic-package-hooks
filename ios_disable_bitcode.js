/**
 * Disable bitcode in xcode builds
 * Credit to akofman's initial version: https://gist.github.com/akofman/b53124f76ec309160e08
 */

var xcode = require('xcode');
var fs = require('fs');

module.exports = function(ctx) {
  if (ctx.opts.platforms.indexOf('ios') < 0) {
    return;
  }

  var deferral = ctx.requireCordovaModule('q').defer();
  var common = ctx.requireCordovaModule('cordova-common');
  var util = ctx.requireCordovaModule('cordova-lib/src/cordova/util');

  var projectName = new common.ConfigParser(util.projectConfig(util.isCordova())).name();
  var projectPath = './platforms/ios/' + projectName + '.xcodeproj/project.pbxproj';
  var project = xcode.project(projectPath);

  project.parse(function(err) {
    if (err) {
      console.error(err);
      deferral.reject('xcode could not parse project');
    } else{
      project.updateBuildProperty('ENABLE_BITCODE', 'NO');
      fs.writeFileSync(projectPath, project.writeSync());
      deferral.resolve();
    }
  });

  return deferral.promise;
};
