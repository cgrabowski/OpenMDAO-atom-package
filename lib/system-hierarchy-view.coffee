{View} = require 'atom-space-pen-views'

module.exports =
class SystemHierarchyView extends View

  @content: ->
    @div =>
      @div class:'openmdao-chart-container', style:'height:100%', =>

  setModel: (@model) ->
    @model.initView(@)

  getTitle: ->
    "System Hierarchy"
