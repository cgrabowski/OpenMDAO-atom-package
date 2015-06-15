SystemHierarchyModel = require './system-hierarchy-model'
SystemHierarchyView = require './system-hierarchy-view'

module.exports =

  activate: ->
    atom.commands.add('atom-workspace', {
      'openmdao-atom:create': => @create()
    })

  create: () ->
    atom.workspace.getActivePane().addItem(new SystemHierarchyModel)
