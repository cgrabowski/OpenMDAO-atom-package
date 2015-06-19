child_process = require 'child_process'
SystemHierarchyModel = require './system-hierarchy-model'
SystemHierarchyView = require './system-hierarchy-view'
chart_server = require './chart-server'
chart_client = require './chart-client'

module.exports =
  deactivate: ->
    chart_client.deactivate()
    chart_server.deactivate()

  activate: ->
    #console.log(localStorage.getItem('openmdao'))

    chart_server.activate()
    chart_client.activate()
    chart_client.onData (data) ->
      #console.log('onData listener: ' + data)
      packageRoot = atom.packages.resolvePackagePath('openmdao-atom')
      cwd = packageRoot + '/bin'
      child_process.exec './build-scripts.py', {cwd: cwd}, (err) ->
        #console.log(err ?= 'scripts rebuilt successfully.')
        for path, model of SystemHierarchyModel.models
          model.resetView()

    isChartFileRegex = /\/lib\/.*\.js|\/views\//
    atom.workspace.observeTextEditors (editor) ->
      filePath = editor.buffer.file.path;
      if isChartFileRegex.test(filePath)
        editor.onDidSave (event) ->
          chart_client.write('chart file saved to ' + filePath)

    atom.views.addViewProvider {
      modelConstructor: SystemHierarchyModel
      viewConstructor: SystemHierarchyView
    }
    atom.commands.add 'atom-workspace', {
      'openmdao-atom:createSysChartFromActiveEditor':
        createSysChartFromActiveEditor
    }
    atom.commands.add '.tree-view.full-menu', {
      'openmdao-atom:createSysChartFromTreeFileContextMenu':
        createSysChartFromTreeFileContextMenu
    }

createSysChartFromActiveEditor = (event) ->
  activePane = atom.workspace.getActivePane()
  activeItem = activePane.getActiveItem()
  model = new SystemHierarchyModel(activeItem.buffer.file.path)
  view = atom.views.getView(model)
  activePane.addItem(view)

createSysChartFromTreeFileContextMenu = (event) ->
  activePane = atom.workspace.getActivePane()
  model = new SystemHierarchyModel(event.target.getAttribute('data-path'))
  view = atom.views.getView(model)
  activePane.addItem(view)
