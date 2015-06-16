SystemHierarchyModel = require './system-hierarchy-model'
SystemHierarchyView = require './system-hierarchy-view'

module.exports =
  activate: ->
    atom.views.addViewProvider
      modelConstructor: SystemHierarchyModel
      viewConstructor: SystemHierarchyView
    atom.commands.add('atom-workspace', {
      'openmdao-atom:createSysChartFromActiveEditor': (event) ->
        createSysChartFromActiveEditor(event)
    })
    atom.commands.add('.tree-view.full-menu', {
      'openmdao-atom:createSysChartFromTreeFileContextMenu': (event) ->
        createSysChartFromTreeFileContextMenu(event)
    })

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
