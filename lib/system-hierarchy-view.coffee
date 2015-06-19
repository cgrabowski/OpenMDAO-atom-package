{View} = require 'atom-space-pen-views'

module.exports =
class SystemHierarchyView extends View

  @content: ->
    @div =>
      @div class:'openmdao-chart-container', style:'height:100%', =>

  setModel: (@model) ->
    @model.setUpView(@)

  removeWebview: ->
    @.find('.openmdao-chart-webview').remove()

  setWebView: (base64Source) ->
    @webview = "<webview class='openmdao-chart-webview' style='height:100%;' "
    @webview += "src='data:text/html;base64," + base64Source + "'></webview>"

    @.find('.openmdao-chart-container')
      .append(@webview)
      .on('contextmenu', -> false)

  getTitle: ->
    "System Hierarchy"
