#!/bin/sh
# Replaces the template code Xcode generates for the DaytrackWidget target
# with Daytrack's widget. Run once, after creating the target (see IOS_SETUP.md).
set -e
cd "$(dirname "$0")/.."
DEST=ios/App/DaytrackWidget
if [ ! -d "$DEST" ]; then
  echo "✗ $DEST not found. Create the Widget Extension target named DaytrackWidget in Xcode first."
  exit 1
fi
rm -f "$DEST"/*.swift
cp ios/widget/*.swift "$DEST"/
echo "✓ Widget code installed into $DEST"
ls "$DEST"
