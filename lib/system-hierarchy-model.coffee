{TextEditor} = require 'atom'
{Model} = require 'theorist'
fs = require('fs')
path = require('path')

module.exports =
  class SystemHierarchyModel extends Model

    constructor: (@lastActiveItem) ->

    getViewClass: ->
      console.log('get view class called')
      require './system-hierarchy-view'

    initView: (@view) ->
      self = @
      packageRoot = atom.packages.resolvePackagePath('openmdao-atom')
      path = packageRoot + '/example/system-hierarchy-chart.html'

      self.view.find('.openmdao-chart-container')
        .append("<webview style='height:100%;' src='" + path + "'></webview>")

    getTitle: ->
      "System Hierarchy"
