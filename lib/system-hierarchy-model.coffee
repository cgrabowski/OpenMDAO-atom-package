{TextEditor} = require 'atom'
{Model} = require 'theorist'
fs = require('fs')
path = require('path')
childProcess = require('child_process')

module.exports =
  class SystemHierarchyModel extends Model

    constructor: (@path) ->
      console.log(@path)

    getViewClass: ->
      console.log('get view class called')
      require './system-hierarchy-view'

    initView: (@view) ->
      self = @
      packageRoot = atom.packages.resolvePackagePath('openmdao-atom')
      scriptPath = '/bin/sys-hierarchy-chart.py'
      outPath = packageRoot + '/bin/chart.html'
      command = 'python ' + packageRoot + scriptPath + ' ' + @path

      childProcess.exec(command, (error, stdout, stderr) ->
        if error
          console.log('error: ' + error.message)
        else
          console.log('no error')

        webview = "<webview style='height:100%;' src='data:text/html;base64,"
        webview += window.btoa(stdout) + "'></webview>"

        self.view.find('.openmdao-chart-container')
          .append(webview)
          .on('contextmenu', -> false)

          atom.workspace.getActivePane().activateNextItem()
        )

    getTitle: ->
      "System Hierarchy"
