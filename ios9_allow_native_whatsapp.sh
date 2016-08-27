#!/bin/bash

if [[ ! -f /usr/libexec/PlistBuddy ]]; then
exit 0
fi

PLIST=platforms/ios/*/*-Info.plist
APPLICATION='whatsapp' # The application we want to add


# Adds the application with new LSApplicationQueriesSchemes array
function AddApplicationWithNewArray {
cat << EOF | # Bypass ATS for test servers
Add :LSApplicationQueriesSchemes array
Add :LSApplicationQueriesSchemes:0 string $APPLICATION
EOF
while read line
do
/usr/libexec/PlistBuddy -c "$line" $PLIST
done
}

# Adds the application without new LSApplicationQueriesSchemes array
function AddApplicationWithoutNewArray {
cat << EOF | # Bypass ATS for test servers
Add :LSApplicationQueriesSchemes:0 string $APPLICATION
EOF
while read line
do
/usr/libexec/PlistBuddy -c "$line" $PLIST
done
}

val=$(/usr/libexec/PlistBuddy -x -c 'print ":LSApplicationQueriesSchemes"' $PLIST 2>/dev/null)

exitCode=$?
if [ "$exitCode" -eq "0" ] # Found the LSApplicationQueriesSchemes element, add just the application
then
if [[ ! "$val" =~ "<string>$APPLICATION</string>" ]]; then # If the application does not exist
AddApplicationWithoutNewArray
fi
else # Didn't find LSApplicationQueriesSchemesKey element, add the element with the application
AddApplicationWithNewArray
fi
