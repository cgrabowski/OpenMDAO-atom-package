net = require('net')
os = require('os')
path = require('path')
child_process = require('child_process')

module.exports =

  deactivate: ->
    child_process.exec('rm ' + @sockPath)
    @server.close (err) ->
      refreshMessage =
        if err?
          'server close err: ' + err.toString()
        else
          'chart server closed successfuly'
      localStorage.setItem('openmdao', refreshMessage)

  activate: ->

    @sockPath =
      if process.platform is 'win32'
        "\\\\.\\pipe\\openmdao-chart-sock"
      else
        path.join(os.tmpdir(), "openmdao-chart-#{process.env.USER}.sock")

    @server = net.createServer (connection) ->
      console.log(process.pid.toString() + ' chart sock server started')
      connection.on 'data', (data) ->
        connection.write(data.toString())

    @server.listen @sockPath

    @server.on 'error', (err) =>
      console.log('chart server error : ' + err.toString())
      child_process.exec('rm ' + @sockPath)
