#!/bin/bash

# Download beta7 of the twilio voice client framework
curl https://media.twiliocdn.com/sdk/ios/voice/releases/2.0.0-beta7/twilio-voice-ios-2.0.0-beta7.tar.bz2 | tar xvj twilio-voice-ios/TwilioVoiceClient.framework/
# Move file to correct location in file structure
mv twilio-voice-ios/TwilioVoiceClient.framework/ platforms/ios/TwilioVoiceClient.framework/
rm -r twilio-voice-ios/
