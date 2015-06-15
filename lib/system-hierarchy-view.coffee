{View} = require 'atom-space-pen-views'
{Emitter} = require 'atom'

module.exports =
class SystemHierarchyView  extends View

  @content: ->
    @div =>
      @h1 'System Hierarchy'
      @canvas style: 'background: #622'

  constructor: -> super

  initialize: (@editor) ->
    @emitter = new Emitter
