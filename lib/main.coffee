child_process = require 'child_process'
pty = require 'pty.js'
SystemHierarchyModel = require './system-hierarchy-model'
SystemHierarchyView = require './system-hierarchy-view'

module.exports =
  activate: ->
    # run auto-build.bash if entr is installed
    child_process.exec 'which entr', (err, stdout, stderr) ->
      if stdout.toString().length > 0
        packageRoot = atom.packages.resolvePackagePath('openmdao-atom')
        command = packageRoot + '/bin/auto-build.bash'
        term = pty.spawn(command, [packageRoot], {cwd: packageRoot + '/bin'})
        term.on 'error', (err) ->
          console.log('auto build error: ' + err)

    atom.views.addViewProvider {
      modelConstructor: SystemHierarchyModel
      viewConstructor: SystemHierarchyView
    }
    atom.commands.add 'atom-workspace', {
      'openmdao-atom:createSysChartFromActiveEditor':
        createSysChartFromActiveEditor
    }
    atom.commands.add '.tree-view.full-menu', {
      'openmdao-atom:createSysChartFromTreeFileContextMenu':
        createSysChartFromTreeFileContextMenu
    }

createSysChartFromActiveEditor = (event) ->
  activePane = atom.workspace.getActivePane()
  activeItem = activePane.getActiveItem()
  model = new SystemHierarchyModel(activeItem.buffer.file.path)
  view = atom.views.getView(model)
  activePane.addItem(view)

createSysChartFromTreeFileContextMenu = (event) ->
  activePane = atom.workspace.getActivePane()
  model = new SystemHierarchyModel(event.target.getAttribute('data-path'))
  view = atom.views.getView(model)
  activePane.addItem(view)
