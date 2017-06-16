#!/usr/bin/env node

// ********************************************************************
// Making PlistObject and generating new project.pbxproj file
var PlistObject = require('plist-generator'),
    fs = require('fs'),
    path = require('path');


module.exports = function(context) {
  // Create PlistObject to track changes to the project.pbxproj file
  var configContents = fs.readFileSync(
    path.join(
      context.opts.projectRoot,
      'config.xml'
    ),
    'utf8'
  );
  var projectName = /<name>([\s\S]*)<\/name>/mi.exec(configContents)[1].trim();
  var pbxprojSource = path.join(
    context.opts.projectRoot,
    'platforms/ios/',
    projectName + '.xcodeproj/project.pbxproj'
  ),
      plistObject = new PlistObject(fs.readFileSync(pbxprojSource, 'utf8'));

  if (!plistObject.plistData) {
    console.log('project.pbxproj isn\'t in a recognized format.');
    console.log('This most likely means that the pbxproj file is corrupted.');
    return;
  }

  if (plistObject.findObject('TwilioVoiceClient.framework')) {
    return console.log('TwilioVoiceClient.framework already added.');
  }

  // Add TwilioVoiceClient.framework to Frameworks and Embed Frameworks
  plistObject.addFrameworkFile('TwilioVoiceClient.framework', '', true);
  // Add a run script to modify the binary TwilioVoiceClient when making builds
  //  so that they only contain the appropriate binaries.  The app store will
  //  reject the app unless this is included.
  var runScriptContents = 'APP_PATH=\\"${TARGET_BUILD_DIR}/${WRAPPER_NAME}\\"\\n\\n' +
    '# This script loops through the frameworks embedded in the application and\\n' +
    '# removes unused architectures.\\nfind \\"$APP_PATH\\" -name \'*.framework\'' +
    ' -type d | while read -r FRAMEWORK\\ndo\\n' +
    'FRAMEWORK_EXECUTABLE_NAME=$(defaults read \\"$FRAMEWORK/Info.plist\\" ' +
    'CFBundleExecutable)\\nFRAMEWORK_EXECUTABLE_PATH=\\"$FRAMEWORK/' +
    '$FRAMEWORK_EXECUTABLE_NAME\\"\\necho \\"Executable is ' +
    '$FRAMEWORK_EXECUTABLE_PATH\\"\\n\\nEXTRACTED_ARCHS=()\\n\\nfor ARCH in ' +
    '$ARCHS\\ndo\\necho \\"Extracting $ARCH from $FRAMEWORK_EXECUTABLE_NAME\\"\\n' +
    'lipo -extract \\"$ARCH\\" \\"$FRAMEWORK_EXECUTABLE_PATH\\" -o ' +
    '\\"$FRAMEWORK_EXECUTABLE_PATH-$ARCH\\"\\n' +
    'EXTRACTED_ARCHS+=(\\"$FRAMEWORK_EXECUTABLE_PATH-$ARCH\\")\\ndone\\n\\n' +
    'echo \\"Merging extracted architectures: ${ARCHS}\\"\\nlipo -o ' +
    '\\"$FRAMEWORK_EXECUTABLE_PATH-merged\\" -create \\"${EXTRACTED_ARCHS[@]}\\"\\n' +
    'rm \\"${EXTRACTED_ARCHS[@]}\\"\\n\\necho \\"Replacing original executable with ' +
    'thinned version\\"\\nrm \\"$FRAMEWORK_EXECUTABLE_PATH\\"\\n' +
    'mv \\"$FRAMEWORK_EXECUTABLE_PATH-merged\\" \\"$FRAMEWORK_EXECUTABLE_PATH\\"\\n\\n' +
    'done';
  plistObject.addShellScript(runScriptContents);

  fs.writeFileSync(pbxprojSource, plistObject.build());
  console.log('Finished modifying project.pbxproj file');
  // End making PlistObject and generating new project.pbxproj file
  // ********************************************************************
}
