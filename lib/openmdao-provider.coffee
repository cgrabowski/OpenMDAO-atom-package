# mirror autocomplete-plus-jedi functionality for openmdao specific suggestions

{$} = require 'atom'

module.exports =
class OpenMDAOProvider
  id: 'autocomplete-openmdao'
  selector: '.source.python'
  providerblacklist: null

  requestHandler: (options) ->
    return new Promise (resolve) ->
      # Build your suggestions here asynchronously...
      suggestions = [text: 'something']
      resolve(suggestions) # When you are done, call resolve and pass your suggestions to it
