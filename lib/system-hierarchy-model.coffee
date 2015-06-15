{TextEditor} = require 'atom'
{Model} = require 'theorist'

module.exports =
  class SystemHierarchyModel extends Model

    constructor: (@lastActiveItem) ->
      #console.log(@lastActiveItem.buffer.getText())
      console.log(@)

    getViewClass: ->
      console.log('get view class called')
      require './system-hierarchy-view'

    getTitle: ->
      "System Hierarchy"
