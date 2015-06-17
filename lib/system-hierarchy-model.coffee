{Model} = require 'theorist'
childProcess = require 'child_process'

module.exports =
  class SystemHierarchyModel extends Model

    constructor: (@path) ->

    getViewClass: ->
      require './system-hierarchy-view'

    initView: (@view) ->
      packageRoot = atom.packages.resolvePackagePath('openmdao-atom')
      scriptPath = '/bin/sys-hierarchy-chart.py'
      outPath = packageRoot + '/bin/chart.html'
      command = 'python ' + packageRoot + scriptPath + ' ' + @path

      childProcess.exec command, (error, stdout, stderr) =>
        if error
          console.log('chart generation failure. error: ' + error.message)
        else
          console.log('chart generation successful. No error.')

        webview = "<webview style='height:100%;' src='data:text/html;base64,"
        webview += window.btoa(stdout) + "'></webview>"

        @view.find('.openmdao-chart-container')
          .append(webview)
          .on('contextmenu', -> false)
          atom.workspace.getActivePane().activateNextItem()

    getTitle: ->
      "System Hierarchy"
