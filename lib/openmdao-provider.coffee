# mirror autocomplete-plus-jedi functionality for openmdao specific suggestions

{$} = require 'atom'

module.exports =
class OpenMDAOProvider
  id: 'autocomplete-openmdao'
  selector: '.source.python'
  providerblacklist: null

  requestHandler: (options) ->
    return new Promise (resolve) ->
      suggestions = []

      # get current text
      text = options.buffer.cachedText
      row = options.cursor.getBufferPosition().row
      column = options.cursor.getBufferPosition().column

      payload =
        source: text
        line: row
        column: column

      $.ajax
        url: 'http://127.0.0.1:7776'
        type: 'POST'
        data: JSON.stringify payload

        success: (data) ->
          console.log 'openmdao data:', data

          # get prefix
          lines = text.split "\n"
          line = lines[row]

          # generate a list of potential prefixes
          indexes = []
          indexes.push line.substr(line.lastIndexOf(" ") + 1)
          indexes.push line.substr(line.lastIndexOf("(") + 2)
          indexes.push line.substr(line.lastIndexOf(".") + 1)

          # sort array by string length - shortest element is the prefix
          prefix = indexes.sort((a, b) ->
            a.length - b.length
          )[0]

          # build suggestions
          for index of data

            label = data[index].description

            if label.length > 80
              label = label.substr(0, 80)

            suggestions.push({
              word: data[index].name,
              prefix: prefix,
              label: label
            })

            resolve(suggestions)

        error: (data) ->
          console.log "Error communicating with server"
          console.log data
