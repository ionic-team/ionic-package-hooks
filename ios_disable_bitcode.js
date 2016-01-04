#!/usr/bin/env node

/**
 * Disable bitcode in xcode builds
 * Credit to akofman's initial version: https://gist.github.com/akofman/b53124f76ec309160e08
 */

var xcode = require('xcode');
var fs = require('fs');
var cordova_util = require('cordova-lib/src/cordova/util');
var ConfigParser = require('cordova-common').ConfigParser;

var projectName = new ConfigParser(cordova_util.projectConfig(cordova_util.isCordova())).name();
var projectPath = './platforms/ios/' + projectName + '.xcodeproj/project.pbxproj';
var myProj = xcode.project(projectPath);

myProj.parse(function(err) {
  if (err){
    console.log('Error: ' + JSON.stringify(err));
  } else{
    myProj.updateBuildProperty('ENABLE_BITCODE', 'NO');
    fs.writeFileSync(projectPath, myProj.writeSync());
  }
});
