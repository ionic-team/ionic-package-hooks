#!/bin/bash

if [[ ! -f /usr/libexec/PlistBuddy ]]; then
    exit 0
fi

PLIST=platforms/ios/*/*-Info.plist

cat << EOF |
Delete :NSAppTransportSecurity
Add :NSAppTransportSecurity dict
Add :NSAppTransportSecurity:NSAllowsArbitraryLoads bool YES
EOF
while read line
do
    /usr/libexec/PlistBuddy -c "$line" $PLIST
done
