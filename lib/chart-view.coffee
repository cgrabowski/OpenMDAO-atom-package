{View} = require 'space-pen'
$ = require 'jquery'

module.exports =
class SystemHierarchyView extends View

  @content: ->
    @div =>
      @div class:'openmdao-chart-container', style:'height:100%', outlet:'container'

  setModel: (@model) ->

  init: (base64Source) ->
    @container.on('contextmenu', -> false)
    @setWebview(base64Source)

  setWebview: (base64Source) ->
    oldWebview = @container.find('.openmdao-chart-webview')

    # Simply resetting the src attribute of the webview caused a serious memory leak.
    # The following prevents the leak:
    oldWebview.remove()
    @container.empty()
    delete oldWebview[0]

    webview = $(document.createElement('webview')).addClass('.openmdao-chart-webview')
    @container.append(webview)
    webview.attr('src', 'data:text/html;base64,' + base64Source)
    webview[0].addEventListener 'did-start-loading', =>
      webview[0].openDevTools()

  getTitle: ->
    "System Hierarchy"
