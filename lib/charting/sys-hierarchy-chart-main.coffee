
window.addEventListener 'load', () ->
  container = document.getElementById 'system-hierarchy-chart'
  chart = new window.SysHierarchyChart(data, {container: container})

window.addEventListener 'click', (event) ->
  event = d3.event
