remote = require 'remote'
dialog = remote.require 'dialog'
BrowserWindow = remote.require 'browser-window'
child_process = require 'child_process'
SystemHierarchyModel = require './system-hierarchy-model'
SystemHierarchyView = require './system-hierarchy-view'
chart_server = require './chart-server'
chart_client = require './chart-client'

module.exports = openmdao =

  deactivate: ->
    chart_client.deactivate()
    chart_server.deactivate()

  activate: ->

    chart_server.onStart () ->
      chart_client.activate()
      chart_client.onData (data) ->
        #console.log('onData listener: ' + data)
        packageRoot = atom.packages.resolvePackagePath('openmdao-atom')
        cwd = packageRoot + '/bin'
        child_process.exec './build-scripts.py', {cwd: cwd}, (err) ->
          #console.log(err ?= 'scripts rebuilt successfully.')
          for path, model of SystemHierarchyModel.models
            model.resetView()

    chart_server.activate()

    isChartFileRegex = /\/lib\/.*\.js|\/views\//
    atom.workspace.observeTextEditors (editor) ->
      filePath = editor.buffer.file.path;
      if isChartFileRegex.test(filePath)
        editor.onDidSave (event) ->
          chart_client.write('chart file saved to ' + filePath)

    atom.views.addViewProvider
      modelConstructor: SystemHierarchyModel
      viewConstructor: SystemHierarchyView

    atom.commands.add 'atom-workspace',
      'openmdao-atom:createChartFromFile': createChartFromFile
      'openmdao-atom:createChartFromEditor': createChartFromEditor

    atom.commands.add '.tree-view.full-menu',
      'openmdao-atom:createChartFromTree': createChartFromTree

createChart = (path) ->
  model = new SystemHierarchyModel(path)
  view = atom.views.getView(model)
  atom.workspace.getActivePane().addItem(view)

createChartFromEditor = ->
  createChart(atom.workspace.getActivePane().getActiveItem().buffer.file.path)

createChartFromTree = (event) ->
  createChart(event.target.getAttribute('data-path'))

createChartFromFile = ->
  # Show the open dialog as child window on Windows and Linux, and as
  # independent dialog on OS X. This matches most native apps.
  parentWindow =
    if process.platform is 'darwin'
      null
    else
      BrowserWindow.getFocusedWindow()

  openOptions =
    properties: ['openFile']
    title: 'Open'

  if process.platform is 'linux'
    if projectPath = @lastFocusedWindow?.projectPath
      openOptions.defaultPath = projectPath

  dialog.showOpenDialog(parentWindow, openOptions, (paths) -> createChart(paths[0]))
