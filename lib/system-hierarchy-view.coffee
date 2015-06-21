{View} = require 'atom-space-pen-views'

module.exports =
class SystemHierarchyView extends View

  @content: ->
    @div =>
      @div class:'openmdao-chart-container', style:'height:100%', =>
        @tag 'webview', class:'openmdao-chart-webview', style:'height:100%;', outlet:'htmlv'
  setModel: (@model) ->
    @model.setUpView(@)

  removeWebview: ->
    @.find('.openmdao-chart-webview').remove()

  setWebView: (base64Source) ->
    @.find('.openmdao-chart-container')
      .on('contextmenu', -> false)
    @htmlv[0].addEventListener 'did-start-loading', =>
      @htmlv[0].openDevTools()
    @htmlv.attr('src', 'data:text/html;base64,' + base64Source)

  getTitle: ->
    "System Hierarchy"
