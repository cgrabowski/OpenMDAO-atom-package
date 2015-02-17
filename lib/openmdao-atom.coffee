OpenmdaoAtomView = require './openmdao-atom-view'
{CompositeDisposable} = require 'atom'

module.exports = OpenmdaoAtom =
  openmdaoAtomView: null
  modalPanel: null
  subscriptions: null

  activate: (state) ->
    @openmdaoAtomView = new OpenmdaoAtomView(state.openmdaoAtomViewState)
    @modalPanel = atom.workspace.addModalPanel(item: @openmdaoAtomView.getElement(), visible: false)

    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

    # Register command that toggles this view
    @subscriptions.add atom.commands.add 'atom-workspace', 'openmdao-atom:toggle': => @toggle()

  deactivate: ->
    @modalPanel.destroy()
    @subscriptions.dispose()
    @openmdaoAtomView.destroy()

  serialize: ->
    openmdaoAtomViewState: @openmdaoAtomView.serialize()

  toggle: ->
    console.log 'OpenmdaoAtom was toggled!'

    if @modalPanel.isVisible()
      @modalPanel.hide()
    else
      @modalPanel.show()
