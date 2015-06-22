{Model} = require 'theorist'
child_process = require 'child_process'
fs = require 'fs'

class ChartModel extends Model
  constructor: (@path) ->
    @view = atom.views.getView(@)
    atom.workspace.getActivePane().addItem(@view)

    packageRoot = atom.packages.resolvePackagePath('openmdao-atom')
    command = 'python ' + packageRoot + @.constructor.scriptPath + ' ' + @path
    child_process.exec command, (error, stdout, stderr) =>
      @view.init(window.btoa(stdout))
      atom.workspace.getActivePane().activateItem(@view)
      console.log('chart generation failure. ' + error.message) if error?

  getViewClass: ->
    require './chart-view'

  resetView: ->
    packageRoot = atom.packages.resolvePackagePath('openmdao-atom')
    command = 'python ' + packageRoot + @.constructor.scriptPath + ' ' + @path
    child_process.exec command, (error, stdout, stderr) =>
      @view.setWebview(window.btoa(stdout))
      console.log('chart generation failure. ' + error.message) if error?

  getTitle: ->
    "System Hierarchy"

class SystemHierarchyChartModel extends ChartModel
  @scriptPath: '/bin/sys-hierarchy-chart.py'
  constructor: (path) -> super(path)

class DependencyMatrixChartModel extends ChartModel
  @scriptPath: '/bin/dependency-matrix-chart.py'
  constructor: (path) -> super(path)

class CombinedChartModel extends ChartModel
  @scriptPath: '/bin/sys-and-dep-chart.py'
  constructor: (path) -> super(path)

module.exports = ChartModelFactory =
  models: {}

  constructors:
    "SystemHierarchyChartModel": SystemHierarchyChartModel
    "DependencyMatrixChartModel": DependencyMatrixChartModel
    "CombinedChartModel": CombinedChartModel

  create: (path) ->
    fs.readFile path, (err, data) =>
      throw new Error(err) if err?
      try
        json = JSON.parse(data)
      catch err
        throw new Error('Error parsing chart data json in ' + path + '\n' + err.message)

      numKeys = Object.keys(json).length
      console.log(json)
      hasDepData = json.hasOwnProperty('depMatrix') and json.hasOwnProperty('labels')

      # There seems to be a problem with using nested ternary statements in coffeescript, so:
      hasSysData =
        if hasDepData and numKeys > 2
          true
        else if not hasDepData and numKeys > 0
          true
        else
          false

      if not hasDepData and not hasSysData
        throw new Error('Could not find system hierarchy data or dependency matrix data in ' + path)

      model =
        if hasSysData and hasDepData
          new @constructors.CombinedChartModel(path)
        else if hasSysData
          new @constructors.SystemHierarchyChartModel(path)
        else if hasDepData
          new @constructors.DependencyMatrixChartModel(path)
        else
          throw new Error('Error constructing ChartModel.')

      @models[@path] = model
