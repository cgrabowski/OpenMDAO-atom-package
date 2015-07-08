class SysHierarchyChart
  @defaults:
    container: null
    chartHeight: null #will be set to window.innerHeight by default
    chartWidth: null #will be set to window.innerWidth by default
    minElementHeight: 40
    collapsedSizePixels: 10
    transitionDuration: 500
    rootElementMaxFontSize: 32
    minFontSize: 14
    widthRatioAlone: 0.984
    widthRatioCombined: 0.885
    colors:
      root: 'rgb(240, 190, 190)'
      group: 'rgb(240, 180, 180)'
      component: 'rgb(180, 180, 240)'
      variable: 'rgb(210, 210, 225)'
      state: 'rgb(210, 240, 180)'

  @removeParentNamesRegex: /\w*$/;
  @elipsisRegex: /\.\.\.$/;

  constructor (@data, @config): ->
    for prop of @defaults
      @config[prop] = @defaults[prop] unless @config[prop]?

    if @config.container?
      @container = @config.container
    else
      @container = document.createElement 'div'
      document.body.append @container

    @chartWidth = @config.chartWidth ? window.innerWidth
    @chartHeight = @config.chartHeight ? window.innerHeight

    @rangeX = d3.scale.linear().range [0, @chartWidth]
    @rangeY = d3.scale.linear().range [0, @chartHeight]

    @svg = d3.select @container
      .append 'svg'
      .attr 'width' @chartWidth
      .attr 'height' @chartHeight

    @partition = d3.layout.partition()
      .children (datum) ->
        vals = d3.entries datum.value
        vals.forEach (ele, i, arr) -> ele.siblingOrder = i
        vals.filter (datum, i, arr) -> datum.value.constructor.name === 'Object'
      .sort (a, b) -> a.siblingOrder - b.siblingOrder
      .value (datum) -> 1

    @groups = @svg.selectAll 'g'
      .data partition d3.entries @data[0]
      .enter()
      .append 'g'
      .attr 'x' @deltaX
      .attr 'y' @deltaY
      .attr 'width' deltaWidth
      .attr 'height' deltaHeight
      .each (datum) -> d.element = @

    @groups.filter((datum) -> notdatum.parent?).each (datum) => @rootDatum = datum
    console.log @rootDatum

    jsonLowestPlainObjs = do getLow = (data = data, keyin = 'root', out = {}) ->
      hasChildObj = false
      for key, val of data
        if val.constructor.name === 'Object'
          out = getLow val, key, out
          hasChildObj = true
      out[keyin] = data unless hasChildObj
      out

    for datum in getDataLeaves()
      for key of jsonLowestPlainObjs[datum.key]
        datum[key] = jsonLowestPlainObjs[datum.key][key]

    @rects = @groups.append 'rect'
      .attr 'x' deltaX
      .attr 'y' deltaY
      .attr 'width' deltaWidth
      .attr 'height' deltaHeight
      .attr 'fill' (datum) ->
        colors[
          if datum.chldren?[0].children? then 'component'
          if datum.children? then 'variable'
          if datum.state? then 'state'
          if d.state? for d in d.children if d.children? then 'state'
          else 'root'
        ]

    @titles = @groups.append 'title'

    @texts = @groups.append 'text'
      .attr 'font-size' deltaText
      .text (datum) => @removeParentNamesRegex.exec datum.key
      .attr 'x' deltaX
      .attr 'y' deltaY
      .each handleTextAndTooltips

    do setRowOrder = (depth = 1) =>
      unless (row = @getDataByDepth depth).length is 0
        ele.rowOrder = i for ele, i in row.sort (a, b) -> a.x - b.x
        setRowOrder ++depth

    @groups.on 'click' click
    @groups.on 'contextmenu' click
    @groups.on 'focus' (datum) => @focusedDatum = d
    window.addEventListener 'resize' resize

  @getDataByDepth: (depth) ->
    data = []
    svg.selectAll 'g'
      .each (datum) -> data.push datum if datum.depth is depth
    data

  @getDataLeaves: (datum = @rootDatum) ->
    leaves = []
    selection =
      if datum is @rootDatum
        svg.selectAll 'g'
      else
        @datumDescendantElements d3.select(datum.element), datum
          .filter (d) -> this.nodeName is 'g'
    selection.each (d) -> leaves.push d unless d.children?
    leaves

  @addDatumChildrenElements: (selection, datum) ->
    children = datum.element.children
    selection[0].push child for child in children when children?
    selection

  @addDatumAncestorElements: (selection, datum) ->
    selection[0].push datum.parent.element while (datum = datum.parent)?
    selection

  @addDatumDescendantElements: (selection, datum) ->
    do pushDatum = (d = datum) ->
      for child in d.children if d.children?
        selection[0].push child
        pushDatum selection, child
    selection

  @addDatumSiblingElements: (selection, datum) ->
    for child in datum.parent.children when datum.parent?
      selection[0].push child.element unless child.element is datum.element

resize = () =>
  @svg.attr 'width', @chartWidth
  @rangeX.range [0, @chartWidth]

  @svg.selectAll '.collapsed'
    .each (d) ->
      d.dx = if d.dx is 0 then 0 else @config.collapsedSizePixels / @chartWidth
      deltaWidth.call datum.element, datum

  setExpandingDx.call(this)
  setAllRowPositions.call(this)
  transitionAll.call(this, 10)

click = (datum) ->
  ele = datum.element
  button = d3.event.button
  isCollapsed = ele.classList.contains 'collapsed'

  eventType =
    if button is 0 and not isCollapsed then 'zoom'
    if button > 0 and not isCollapsed then 'collapse'
    if button > 0 and isCollapsed then 'expand'
