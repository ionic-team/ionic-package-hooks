#!/usr/bin/env node

// deeplinks plugins generates entitlements in a way that isn't compatible
// with latest cordova build system, so we do it ourselves.
//
// https://github.com/ionic-team/ionic-plugin-deeplinks/issues/97

const fs = require('fs');[]
const plist = require('plist');

const PlistKey = 'com.apple.developer.associated-domains';

module.exports = function (ctx) {
    if (ctx.opts.platforms.indexOf('ios') < 0) { return; }

    const common = ctx.requireCordovaModule('cordova-common');
    const util = ctx.requireCordovaModule('cordova-lib/src/cordova/util');

    const config = new common.ConfigParser(util.projectConfig(util.isCordova()));
    const projectName = config.name();
    const paths = [
        `./platforms/ios/${projectName}/Entitlements-Debug.plist`,
        `./platforms/ios/${projectName}/Entitlements-Release.plist`
    ];
    const plugin = config.getPlugin('ionic-plugin-deeplinks');
    if (!plugin) { return; }
    const domain = [`applinks:${plugin.variables.DEEPLINK_HOST}`];

    paths.forEach(path => addEntitlementsToFile(path, domain));
}

function addEntitlementsToFile(path, domain) {
    const origFileContent = fs.readFileSync(path, 'utf8');
    const parsedPlist = plist.parse(origFileContent);

    if (parsedPlist[PlistKey]) {
        // give ourselves a chance to notice if/when the plugin gets fixed
        // (though this might be too early)
        console.warn('Entitlement already exists!', path, parsedPlist[PlistKey]);
    }
    parsedPlist[PlistKey] = domain;

    const newFileContent = plist.build(parsedPlist);
    fs.writeFileSync(path, newFileContent, { encoding: 'utf8' });
}

