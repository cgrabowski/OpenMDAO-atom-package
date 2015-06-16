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
      command = 'python ' + packageRoot + scriptPath + ' ' + @path + ' -o ' + outPath

      childProcess.exec(command, (error, stdout, stderr) ->
        console.log(command)
        if error
          console.log('error: ' + error.message)
        else
          console.log('no error')

        self.view.find('.openmdao-chart-container')
          .append("<webview style='height:100%;' src='" + outPath + "'></webview>")
          .on('contextmenu', -> false)

          atom.workspace.getActivePane().activateNextItem()
        )

    getTitle: ->
      "System Hierarchy"
