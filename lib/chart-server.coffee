ipc = require('node-ipc')
os = require('os')
path = require('path')
child_process = require('child_process')
fs = require('fs')

module.exports =
  onStart: (callback) ->
    @onStartListeners ?= []
    @onStartListeners.push(callback)

  deactivate: ->
    if @ownsSock
      child_process.exec('rm ' + @sockPath)

  activate: ->
    ipc.config.id = 'openmdao-chart-server'
    ipc.config.retry = 1000
    ipc.config.silent = true

    @ownsSock = true
    @onStartListeners ?= []
    @sockPath =
      if process.platform is 'win32'
        "\\\\.\\pipe\\openmdao-chart-sock"
      else
        path.join(os.tmpdir(), "openmdao-chart-#{process.env.USER}.sock")

    if fs.existsSync(@sockPath)
      console.log('sock fle exists. not starting server.')
      callback() for callback in @onStartListeners
      @ownsSock = false
      return


    ipc.serve @sockPath, () =>
      console.log('started chart server')
      ipc.server.on 'message', (data, socket) =>
        #console.log('server got a message: ' + data)
        ipc.server.broadcast('message', data)
      callback() for callback in @onStartListeners

    ipc.server.start()
