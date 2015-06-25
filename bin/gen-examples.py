#!/usr/bin/python

import subprocess

script_paths = [
    './sys-hierarchy-chart.py',
    './dependencies-chart.py',
    './sys-and-dep-chart.py'
  ]

data_paths = [
    '../example/sys-hierarchy.json',
    '../example/dependencies.json',
    '../example/combined-data.json'
  ]

output_paths = [
    '../example/sys-hierarchy.html',
    '../example/dependencies.html',
    '../example/sys-and-dep-chart.html'
  ]

for script, data, out in zip(script_paths, data_paths, output_paths):
  subprocess.Popen([script, data, '-o' + out])
