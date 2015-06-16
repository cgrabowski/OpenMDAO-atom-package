SystemHierarchyModel = require './system-hierarchy-model'
SystemHierarchyView = require './system-hierarchy-view'

module.exports =

  activate: ->
    atom.views.addViewProvider
      modelConstructor: SystemHierarchyModel
      viewConstructor: SystemHierarchyView
    atom.commands.add('atom-workspace', {
      'openmdao-atom:createSysChartFromMenu': => @createSysChartFromMenu()
    })

  createSysChartFromMenu: () ->
    activePane = atom.workspace.getActivePane()
    activeItem = activePane.getActiveItem()
    model = new SystemHierarchyModel(activeItem.buffer.file.path)
    view = atom.views.getView(model)
    activePane.addItem(view)
