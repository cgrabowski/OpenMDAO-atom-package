{View} = require 'atom-space-pen-views'

module.exports =
class SystemHierarchyView extends View

  @content: ->
    @div =>
      @div class:'openmdao-chart-container', style:'height:100%', =>
        @h1 'System Hierarchy'


  constructor: ->
    super

  setModel: (@model) ->
    @model.initView(@)

  getTitle: ->
    "System Hierarchy"
