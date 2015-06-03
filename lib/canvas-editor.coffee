{TextEditor} = require 'atom'

module.exports =
  class CanvasEditor #extends TextEditor

    constructor: ->
      #super
      console.log 'woot!'

    getViewClass: ->
      require './canvas-editor-view'

    getTitle: ->
      "openMDAO problem"

CanvasEditor::getViewClass = -> require './canvas-editor-view'
