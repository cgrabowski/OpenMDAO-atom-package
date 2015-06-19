net = require('net')
os = require('os')
path = require('path')

module.exports =
  onData: (callback) ->
    @onDataListeners ?= []
    @onDataListeners.push(callback)
  deactivate: ->
    @sock.end()
  activate: ->
    @onDataListeners ?= []
    @sockPath =
      if process.platform is 'win32'
        '\\\\.\\pipe\\openmdao-chart-sock'
      else
        path.join(os.tmpdir(), "openmdao-chart-#{process.env.USER}.sock")

    @sock = net.connect @sockPath, () ->
      console.log(process.pid.toString() + ' connected to chart sock server')

    @sock.on 'data', (data) =>
      #console.log(process.pid.toString() + ' chart sock got data: ' + data.toString())
      callback(data) for callback in @onDataListeners

    @sock.on 'error', (err) ->
      console.log(process.pid.toString() + ' chart sock error : ' + err.toString())

    @sock.on 'end', (data) ->
      console.log(process.pid.toString() + ' chart sock ended: ' + data.toString())

  write: (data) ->
    @sock.write(data)
