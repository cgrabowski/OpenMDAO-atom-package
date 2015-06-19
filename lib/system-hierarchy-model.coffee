{Model} = require 'theorist'
childProcess = require 'child_process'

module.exports =
  class SystemHierarchyModel extends Model
    @models = {}

    constructor: (@path) ->
      SystemHierarchyModel.models[@path] = @

    getViewClass: ->
      require './system-hierarchy-view'

    resetView: ->
      @view.removeWebview()
      @setUpView(@view)

    setUpView: (@view) ->
      packageRoot = atom.packages.resolvePackagePath('openmdao-atom')
      scriptPath = '/bin/sys-hierarchy-chart.py'
      outPath = packageRoot + '/bin/chart.html'
      command = 'python ' + packageRoot + scriptPath + ' ' + @path

      childProcess.exec command, (error, stdout, stderr) =>
        #if error
        #  console.log('chart generation failure. ' + error.message)
        #else
        #  console.log('chart generation successful. No error.')

        @view.setWebView(window.btoa(stdout))

    getTitle: ->
      "System Hierarchy"
