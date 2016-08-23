#!/bin/bash

if [[ ! -f /usr/libexec/PlistBuddy ]]; then
    exit 0
fi

PLIST=platforms/ios/*/*-Info.plist

# Bypass ATS for test servers
cat << EOF |
Delete :LSApplicationQueriesSchemes
Add :LSApplicationQueriesSchemes array
Add :LSApplicationQueriesSchemes:0 string 'whatsapp'
EOF
while read line
do
    /usr/libexec/PlistBuddy -c "$line" $PLIST
done
