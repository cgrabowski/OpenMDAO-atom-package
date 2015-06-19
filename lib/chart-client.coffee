ipc = require('node-ipc')
os = require('os')
path = require('path')

module.exports =
  onData: (callback) ->
    @onDataListeners ?= []
    @onDataListeners.push(callback)
    
  deactivate: ->

  activate: ->
    @onDataListeners ?= []
    @sockPath =
      if process.platform is 'win32'
        '\\\\.\\pipe\\openmdao-chart-sock'
      else
        path.join(os.tmpdir(), "openmdao-chart-#{process.env.USER}.sock")

    ipc.config.id = 'client ' + process.pid
    ipc.config.retry = 1000
    ipc.config.silent

    ipc.connectTo 'openmdao-chart-server', @sockPath, () =>
      ipc.of['openmdao-chart-server'].on 'connect', () =>

        console.log('connected to chart server')
        ipc.of['openmdao-chart-server'].emit('message', 'message from client')

        ipc.of['openmdao-chart-server'].on 'disconnect', () ->
          console.log('client disconnected')

        ipc.of['openmdao-chart-server'].on 'message', (data) =>
          #console.log('got a message from server: ' + data)
          callback(data) for callback in @onDataListeners

  write: (data) ->
    #console.log('client attempting to send message: ' + data)
    ipc.of['openmdao-chart-server'].emit('message', data)
