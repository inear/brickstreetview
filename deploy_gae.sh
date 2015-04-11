#!/bin/bash

TARGET_APP_ID='brickstreetview'

echo "Hello there, I'm your friendly deploy script!"
if [ ! -f 'app.yaml' ]; then
    echo "I'm sorry, but you seem to be in the wrong directory."
    exit 1
fi
if [ ! -f  `which appcfg.py` ]; then
    echo "I can't find your App Engine commandline tools. Open the App Engine launcher -> application menu -> make symlinks; then come back and try again."
fi

npm run prod

mv app.yaml app.yaml.tmp
sed "s/application: .*/application: $TARGET_APP_ID/; s/^version: 1/version: 1/" <app.yaml.tmp >app.yaml

echo "Okay, deploying."

appcfg.py update . --oauth2

echo "Deploy done! Restoring app.yaml."

rm -f app.yaml
mv app.yaml.tmp app.yaml

echo "All done! The application is now live at: http://1.$TARGET_APP_ID.appspot.com/"
