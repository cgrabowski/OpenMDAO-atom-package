#!/bin/bash
#
# Automatically rebuilds scripts when content they depend on changes.
#
# For example, when ../lib/system-hierarchy-chart.js is saved,
# the build-scripts.py script wll be executed, which will
# in turn rebuild the sys-herarchy-chart.py script
#
# This script requires the entr package, which is available on Linux and Mac.
# When the OpenMDAO package is opened in dev mode in Atom,
# the package automatically detects if entr is installed and, if it is,
# this script will run in the background.

# Listen for changes in js files in lib directory
# and all files in views directory
ls ../lib/*.js ../views/* | entr "./build-scripts.py"
