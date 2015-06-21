{Model} = require 'theorist'
child_process = require 'child_process'
fs = require 'fs'

class ChartModel extends Model
  constructor: (@path) ->

  getViewClass: ->
    require './system-hierarchy-view'

  resetView: ->
    @view.removeWebview()
    @setUpView(@view)

  setUpView: (@view) ->
    packageRoot = atom.packages.resolvePackagePath('openmdao-atom')
    command = 'python ' + packageRoot + @scriptPath + ' ' + @path

    child_process.exec command, (error, stdout, stderr) =>
      @view.setWebView(window.btoa(stdout))
      atom.workspace.getActivePane().activateItem(@view)
      if error
        console.log('chart generation failure. ' + error.message)
      else
        console.log('chart generation successful. No error.')

      getTitle: ->
        "System Hierarchy"

class SystemHierarchyChartModel extends ChartModel
  constructor: (path) -> super(path)
  scriptPath: '/bin/sys-hierarchy-chart.py'

class DependencyMatrixChartModel extends ChartModel
  constructor: (path) -> super(path)
  scriptPath: '/bin/dependency-matrix-chart.py'

class CombinedChartModel extends ChartModel
  constructor: (path) -> super(path)
  scriptPath: '/bin/sys-and-dep-chart.py'

module.exports = ChartModelFactory =
  models: {}

  create: (path) ->
    model = new @constructors.SystemHierarchyChartModel(path)
    @models[@path] = model
    view = atom.views.getView(model)
    atom.workspace.getActivePane().addItem(view)
    model

  constructors:
    "SystemHierarchyChartModel": SystemHierarchyChartModel
    "DependencyMatrixChartModel": DependencyMatrixChartModel
    "CombinedChartModel": CombinedChartModel
