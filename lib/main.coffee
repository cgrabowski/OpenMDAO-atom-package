SystemHierarchyModel = require './system-hierarchy-model'
SystemHierarchyView = require './system-hierarchy-view'

module.exports =

  activate: ->
    atom.views.addViewProvider
      modelConstructor: SystemHierarchyModel
      viewConstructor: SystemHierarchyView
    atom.commands.add('atom-workspace', {
      'openmdao-atom:create': => @create()
    })

  create: () ->
    activePane = atom.workspace.getActivePane()
    activeItem = activePane.getActiveItem()
    model = new SystemHierarchyModel(activeItem)
    view = atom.views.getView(model)
    activePane.addItem(view)
