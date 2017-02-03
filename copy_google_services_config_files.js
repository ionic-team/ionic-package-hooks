#!/usr/bin/env node
'use strict';


/**
 * This hook makes sure projects using [cordova-plugin-firebase](https://github.com/arnesson/cordova-plugin-firebase)
 * will build properly and have the required key files copied to the proper destinations when the app is build on Ionic Cloud using the package command.
 */


var fs = require('fs');

var config = fs.readFileSync('config.xml')
    .toString();
var name = getValue(config, 'name');


// Copy key files to their platform specific folders
if (directoryExists('platforms/ios')) {
    copyIosKey();
}

if (directoryExists('platforms/android')) {
    copyAndroidKey();
}


function copyIosKey() {
    var paths = [
        'GoogleService-Info.plist',
        'platforms/ios/www/GoogleService-Info.plist'
    ];

    for (var i = 0; i < paths.length; i++) {
        if (fileExists(paths[i])) {
            try {
                var contents = fs.readFileSync(paths[i]).toString();
                fs.writeFileSync('platforms/ios/' + name + '/Resources/GoogleService-Info.plist', contents);
            } catch(err) {
                process.stdout.write(err);
            }

            break;
        }
    }
}

function copyAndroidKey() {
    var paths = [
        'google-services.json',
        'platforms/android/assets/www/google-services.json'
    ];

    for (var i = 0; i < paths.length; i++) {
        if (fileExists(paths[i])) {
            try {
                var contents = fs.readFileSync(paths[i]).toString();
                fs.writeFileSync('platforms/android/google-services.json', contents);

                var json = JSON.parse(contents);
                var strings = fs.readFileSync('platforms/android/res/values/strings.xml')
                    .toString();

                // strip non-default value
                strings = strings.replace(new RegExp('<string name="google_app_id">([^\@<]+?)</string>', 'i'), '');

                // strip non-default value
                strings = strings.replace(new RegExp('<string name="google_api_key">([^\@<]+?)</string>', 'i'), '');

                // strip empty lines
                strings = strings.replace(new RegExp('(\r\n|\n|\r)[ \t]*(\r\n|\n|\r)', 'gm'), '$1');

                // replace the default value
                strings = strings.replace(new RegExp('<string name="google_app_id">([^<]+?)</string>', 'i'), '<string name="google_app_id">' + json.client[0].client_info.mobilesdk_app_id + '</string>');

                // replace the default value
                strings = strings.replace(new RegExp('<string name="google_api_key">([^<]+?)</string>', 'i'), '<string name="google_api_key">' + json.client[0].api_key[0].current_key + '</string>');

                fs.writeFileSync('platforms/android/res/values/strings.xml', strings);
            } catch(err) {
                process.stdout.write(err);
            }

            break;
        }
    }
}


function getValue(config, name) {
    var value = config.match(new RegExp('<' + name + '>(.*?)</' + name + '>', 'i'));
    if(value && value[1]) {
        return value[1]
    } else {
        return null
    }
}

function fileExists(path) {
    try  {
        return fs.statSync(path)
            .isFile();
    }
    catch (e) {
        return false;
    }
}

function directoryExists(path) {
    try  {
        return fs.statSync(path)
            .isDirectory();
    }
    catch (e) {
        return false;
    }
}
