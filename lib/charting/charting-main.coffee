sysChart = null
depChart = null

window.addEventListener 'load', () ->
  if data.systemHierarchy?
    container = document.getElementById 'system-hierarchy-chart'
    sysChart = new window.SysHierarchyChart data, {container: container}

  d3.selectAll('g').on 'click', click
  d3.selectAll('g').on 'contextmenu', click

click = (datum) ->
  button = d3.event.button
  ele = datum.element
  if button is 0 and not isCollapsed(ele)
    sysChart.zoom datum
  else if button > 0 and isCollapsed(ele)
    sysChart.expand datum
  else if button > 0
    sysChart.collapse datum


isCollapsed = (element) -> element.classList.contains('collapsed')
