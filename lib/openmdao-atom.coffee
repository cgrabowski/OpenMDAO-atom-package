# mirror autocomplete-plus-jedi functionality for openmdao specific suggestions

cp = require 'child_process'
OpenMDAOProvider = require './openmdao-provider'

module.exports = OpenmdaoAtom =
  provider: null
  openmdaoServer: null

  activate: (state) ->
    if !@openmdaoServer
      projectPath = atom.project.getPath()
      command = "python " + __dirname + "/openmdao-complete.py '" + projectPath + "'"
      @openmdaoServer = cp.exec command

    @provider = new OpenMDAOProvider()

  deactivate: ->
    if @openmdaoServer
      @openmdaoServer.kill()

  getProvider: ->
    return {providers: [@provider]}
