#!/bin/bash

if [[ ! -f /usr/libexec/PlistBuddy ]]; then
    exit 0
fi

PLIST=platforms/ios/*/*-Info.plist

# Bypass ATS for test servers
cat << EOF |
Delete :LSApplicationQueriesSchemes
Add :LSApplicationQueriesSchemes array
Add :LSApplicationQueriesSchemes:0 string 'fbapi'
Add :LSApplicationQueriesSchemes:1 string 'fbapi20130214'
Add :LSApplicationQueriesSchemes:2 string 'fbapi20130410'
Add :LSApplicationQueriesSchemes:3 string 'fbapi20130702'
Add :LSApplicationQueriesSchemes:4 string 'fbapi20131010'
Add :LSApplicationQueriesSchemes:5 string 'fbapi20131219'
Add :LSApplicationQueriesSchemes:6 string 'fbapi20140410'
Add :LSApplicationQueriesSchemes:7 string 'fbapi20140116'
Add :LSApplicationQueriesSchemes:8 string 'fbapi20150313'
Add :LSApplicationQueriesSchemes:9 string 'fbapi20150629'
Add :LSApplicationQueriesSchemes:10 string 'fbauth'
Add :LSApplicationQueriesSchemes:11 string 'fbauth2'
EOF
while read line
do
    /usr/libexec/PlistBuddy -c "$line" $PLIST
done
