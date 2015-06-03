CanvasEditor = require './canvas-editor'
CanvasEditorView = require './canvas-editor-view'

{TextEditor} = require 'atom'

module.exports =

  activate: ->
    atom.commands.add('atom-workspace', {
      'openmdao-atom:create': => @create()
    })

  create: () ->
    atom.workspace.getActivePane().addItem(new CanvasEditor)
