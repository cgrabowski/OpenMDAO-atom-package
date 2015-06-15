{View} = require 'atom-space-pen-views'
{CompositeDisposable} = require 'atom'

module.exports =
class SystemHierarchyView extends View

  @content: ->
    @div =>
      @h1 'System Hierarchy'
      @canvas style: 'background: #622'

  constructor: ->
    @subscriptions = new CompositeDisposable
    super

  setModel: (@model) ->
    @model.view = @

  getTitle: ->
    "System Hierarchy"
