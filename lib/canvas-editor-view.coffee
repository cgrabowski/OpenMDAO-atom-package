{View} = require 'atom-space-pen-views'
{Emitter} = require 'atom'

module.exports =
class CanvasEditorView  extends View

  @content: ->
    @div =>
      @h1 'OpenMDAO Visualize'
      @canvas style: 'background: #622'

  constructor: -> super

  initialize: (@editor) ->
    @emitter = new Emitter
