{TextEditor} = require 'atom'

module.exports =
  class SystemHierarchyModel

    constructor: ->
      console.log 'woot!'

    getViewClass: ->
      require './system-hierarchy-view'

    getTitle: ->
      "System Hierarchy"

SystemHierarchyModel::getViewClass = -> require './system-hierarchy-view'
