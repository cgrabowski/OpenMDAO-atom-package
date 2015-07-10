window.SysHierarchyChart =
class SysHierarchyChart
  defaults:
    container: null
    minElementHeight: 40
    collapsedSizePixels: 10
    transitionDuration: 500
    rootElementMaxFontSize: 32
    minFontSize: 14
    colors:
      root: 'rgb(240, 190, 190)'
      group: 'rgb(240, 180, 180)'
      component: 'rgb(180, 180, 240)'
      variable: 'rgb(210, 210, 225)'
      state: 'rgb(210, 240, 180)'

  removeParentNamesRegex: /\w*$/;
  elipsisRegex: /\.\.\.$/;

  constructor: (@data, @config = {}) ->
    self = @

    for prop, val of @defaults
      @config[prop] = val unless @config[prop]?

    if @config.container?
      @container = @config.container
    else
      @container = document.createElement 'div'
      document.body.appendChild @container

    @chartWidth = parseInt(window.getComputedStyle(@container).width)
    @chartHeight = window.innerHeight - 20

    @rangeX = d3.scale.linear().range [0, @chartWidth]
    @rangeY = d3.scale.linear().range [0, @chartHeight]

    @svg = d3.select(@container)
      .append('svg')
      .attr('width', @chartWidth)
      .attr('height', @chartHeight)

    partition = d3.layout.partition()
      .children((datum) ->
        vals = d3.entries datum.value
        vals.forEach (ele, i, arr) -> ele.siblingOrder = i
        vals.filter (datum, i, arr) -> datum.value.constructor.name is 'Object'
      )
      .sort((a, b) -> a.siblingOrder - b.siblingOrder)
      .value((datum) -> 1)

    @groups = @svg.selectAll('g')
      .data(partition(d3.entries(@data.systemHierarchy)[0]))
      .enter()
      .append('g')
      .each((datum) ->
        datum.element = @
        datum.chart = self)
      .attr('x', @deltaX)
      .attr('y', @deltaY)
      .attr('width', @deltaWidth)
      .attr('height', @deltaHeight)
      .each (datum) => @rootDatum = datum unless datum.parent?

    jsonLowestPlainObjs = do getLow = (data = data, keyin = 'root', out = {}) ->
      hasChildObj = false
      for key, val of data
        if val.constructor.name is 'Object'
          out = getLow val, key, out
          hasChildObj = true
      out[keyin] = data unless hasChildObj
      out

    for datum in @getDataLeaves()
      for key of jsonLowestPlainObjs[datum.key]
        datum[key] = jsonLowestPlainObjs[datum.key][key]

    @rects = @groups.append('rect')
      .attr('x', @deltaX)
      .attr('y', @deltaY)
      .attr('width', @deltaWidth)
      .attr('height', @deltaHeight)
      .attr 'fill', (datum) =>
        type = 'group'
        type = 'root' if datum.depth is 0
        type = 'component' if datum.children? and not datum.children[0].children?
        type = 'variable' if not datum.children?
        type = 'state' if datum.state?
        if datum.children?
          for child in datum.children
            type = 'state' if child.state?

        @config.colors[type]

    @titles = @groups.append('title')

    @texts = @groups.append('text')
      .attr('font-size', @deltaText)
      .text((datum) => @removeParentNamesRegex.exec datum.key)
      .attr('x', @deltaX)
      .attr('y', @deltaY)
      .each(@handleTextAndTooltips)

    do setRowOrder = (depth = 1) =>
      unless (row = @getDataByDepth depth).length is 0
        ele.rowOrder = i for ele, i in row.sort (a, b) -> a.x - b.x
        setRowOrder ++depth

    @groups.on 'focus', (datum) => @focusedDatum = datum
    window.addEventListener 'resize', @resize

    helpIconElements = document.getElementsByClassName 'help-icon'
    helpDiv = document.getElementById 'help'
    closeHelpButton = document.getElementById 'close-help-button'

    for i in [0..helpIconElements.length - 1]
      helpIconElements.item(i).addEventListener 'click', (event) ->
        helpDiv.style.display = 'inline-block'
        for ii in [0..helpIconElements.length - 1]
          helpIconElements.item(ii).style.display = 'none'
        false

    closeHelpButton.addEventListener 'click', (event) ->
      for i in [0..helpIconElements.length - 1]
        helpIconElements.item(i).style.display = 'block'
      helpDiv.style.display = 'none'
      false

  getDataByDepth: (depth) ->
    data = []
    @svg.selectAll('g')
      .each (datum) -> data.push datum if datum.depth is depth
    data

  getDataLeaves: (datum = @rootDatum) ->
    leaves = []
    selection =
      if datum is @rootDatum
        @svg.selectAll 'g'
      else
        @datumDescendantElements d3.select(datum.element), datum
          .filter (d) -> this.nodeName is 'g'
    selection.each (d) -> leaves.push d unless d.children?
    leaves

  addDatumChildrenElements: (selection, datum) ->
    children = datum.element.children
    selection[0].push child for child in children when children?
    selection

  addDatumAncestorElements: (selection, datum) ->
    selection[0].push datum.parent.element while (datum = datum.parent)?
    selection

  addDatumDescendantElements: (selection, datum) ->
    do pushDatum = (d = datum) ->
      if d.children?
        for child in d.children
          selection[0].push child.element
          pushDatum selection, child
    selection

  addDatumSiblingElements: (selection, datum) ->
    for child in datum.parent.children when datum.parent?
      selection[0].push child.element unless child.element is datum.element

  zoom: (datum) =>
    console.log 'zoom'
    @rangeX.domain([datum.x, datum.x + datum.dx])
    @rangeY.domain([datum.y, 1]).range([`datum.y === 0 ? 0 : 20`, @chartHeight])
    @transitionAll()

  collapse: (datum) =>
    return if datum is @rootDatum
    cw = @chartWidth

    numNotCollapsed = (@getDataByDepth(datum.depth).filter (d, i, arr) =>
      not @isCollapsed d.element).length

    return if numNotCollapsed is 1

    collapsing = @addDatumDescendantElements(d3.select(datum.element), datum)

    collapsing.each (d) =>
      datum.element.classList.add 'collapsed'
      this.style.visibility = 'hidden' if this.nodeName is 'text'
      d.dx = 0
      parent = d
      while @isCollapsed parent.element
        parent.dx = @config.collapsedSizePixels / @chartWidth
        parent = parent.parent
      d.x = datum.x

    child = datum
    while child.children?
      stateVar = null
      for c, i in child.children
        if c.state?
          stateVar = c
          stateVar.dx = @config.collapsedSizePixels / cw
          break
      for c, i in child.children
        if stateVar is null and i is 0
          c.dx = @config.collapsedSizePixels / cw
        else if stateVar isnt d
          c.dx = 0
          d.dx = 0 for d, i in @addDatumDescendantElements(d3.select(c.element), c)
      child = child.children[0]

    @setExpandingDx()
    @setAllRowPositions()
    @transitionAll()

  expand: (datum) ->
    selection = d3.select datum.element
    @datumChildrenElements selection, datum
    @datumDescendantElements selection, datum
    selection.classed 'collapsed', false

    rootExpansionDatum = do traverseAncestors = (d = datum) =>
      parent = d.parent
      parentSelection = d3.select parent.element
      return d unless @isCollapsed parentSelection
      parentSelection.classed 'collapsed', false

      numExpandedChildren =
        (parent.children.filter (dd, i, arr) => not @isCollapsed dd.element).length

      if numExpandedChildren is 1
        for dd in parent.children
          @datumDescendantElements(d3.select(dd.element), dd).classed 'collapsed', false

      traverseAncestors parent

    @setExpandingDx()
    @setAllRowPositions()
    @transitionAll()

    rootExpansionDatum

  transitionAll: (duration = @config.transitionDuration) ->
    @svg.selectAll('g, rect, text').transition()
      .duration(duration)
      .attr('x', @deltaX)
      .attr('y', @deltaY)
      .attr('width', @deltaWidth)
      .attr('height', @deltaHeight)
      .filter((datum) -> datum.element.nodeName is 'text')
      .attr('font-size', @deltaText)
      .each('end', @handleTextAndTooltips)

  resize: () =>
    @chartWidth = parseInt(window.getComputedStyle(@container).width)
    @chartHeight = window.innerHeight - 20

    @svg.attr 'width', @chartWidth
    @svg.attr 'height', @chartHeight
    @rangeX.range [0, @chartWidth]
    @rangeY.range [0, @chartHeight]

    @svg.selectAll('.collapsed')
      .each (d) =>
        d.dx = if d.dx is 0 then 0 else @config.collapsedSizePixels / @chartWidth
        @deltaWidth datum

    @setExpandingDx()
    @setAllRowPositions()
    @transitionAll(10)

  isCollapsed: (element) -> element.classList.contains 'collapsed'

  setExpandingDx: () =>
    expanding = @svg.selectAll('g').filter (d) => not @isCollapsed d.element
    leaves = @getDataLeaves()
    numExpandedLeaves = 0
    numCollapsedAreas = 0

    for leaf, i in leaves
      if @isCollapsed leaf.element
        if leaf.dx is 0 then numExpandedLeaves += 1 else numCollapsedAreas += 1

    unCollapsedArea = @chartWidth - numCollapsedAreas * @config.COLLAPSED_SIZE_PIXELS
    leafdx = 1 / numExpandedLeaves * unCollapsedArea / @chartWidth

    for datum in expanding
      return unless datum.parent?

      lvs = @getDataLeaves datum
      numExpanded = (lvs.filter (d, i, arr) -> not @isCollapsed d.element).length

      numCollapsed = 0
      do findCollapsed = (d) =>
        return unless children = d.children?
        for child in children
          if @isCollapsed child.element then ++numCollapsed else findCollapsed child

      datum.dx = leafdx * numExpandedLeaves + numCollapsedAreas *
        @config.COLLAPSED_SIZE_PIXELS / @chartWidth

  setAllRowPositions: () =>
    @groups.each (datum) =>
      return unless datum.parent?
      laterals = @getDataByDepth datum.depth

      datum.newX = 0;
      unless laterals.indexOf(datum) is 0
        for i in [0..laterals.indexOf(datum) - 1]
          datum.newX += laterals[i].dx

    @groups.each (datum) ->
      return unless datum.parent?
      datum.x = datum.newX
      delete datum.newX

  deltaX: (datum) ->
    chart = datum.chart
    if @.nodeName is 'text'
      chart.rangeX(datum.x) + chart.deltaWidth(datum) / 2 - @.getBBox().width / 2
    else
      chart.rangeX datum.x

  deltaY: (datum) ->
    chart = datum.chart
    if @.nodeName is 'text'
      chart.rangeY(datum.y) + @.getBBox().height
    else
      chart.rangeY datum.y

  deltaWidth: (datum) ->
    chart = datum.chart
    chart.rangeX(datum.x + datum.dx) - chart.rangeX(datum.x)

  deltaHeight: (datum) ->
    chart = datum.chart
    chart.rangeY(datum.y + datum.dy) - chart.rangeY(datum.y)

  deltaText: (datum) ->
    config = datum.chart.config
    rootRect = datum.chart.rootDatum.element.getElementsByTagName('rect')[0]
    height = parseInt(rootRect.getAttribute 'height')
    rootFontSize =
      if height * 0.8 > config.rootElementMaxFontSize
        config.rootElementMaxFontSize
      else
        height * 0.8
    calcedSize = rootFontSize - 0.15 * rootFontSize * datum.depth

    if calcedSize > config.minFontSize then calcedSize else config.minFontSize

  handleTextAndTooltips: (datum) ->
    chart = datum.chart
    ele = null
    for i in [0..datum.element.childNodes.length - 1]
      child = datum.element.childNodes.item(i)
      ele =  child if child.nodeName is 'text'

    ele.innerHTML = chart.removeParentNamesRegex.exec datum.key
    gw = ele.parentNode.getAttribute 'width'
    tw = ele.getBBox().width
    siblings = ele.parentNode.childNodes
    tooltip = null

    for i in [0..siblings.length - 1]
      if siblings.item(i).nodeName is 'title'
        tooltip = siblings.item(i)

    if tw > gw - 10
      if chart.isCollapsed ele.parentNode
        ele.style.visiblity = 'hidden'
        tooltip.innerHTML = 'datum.key'
      else
        ele.style.visiblity = 'visible'
        tooltip.innerHTML = ''

        this.innerHTML += '...' unless chart.elipsisRegex.test ele.innerHTML
        textLength = ele.innerHTML.length - 3

        while ele.getBBox().width > parseInt(ele.parentNode.getAttribute 'width') - 10
          if textLength < 1
            ele.innerHTML = '...'
            break
          else
            ele.innerHTML = ele.innerHTML.substr(0, --textLength) + '...'

        ele.innerHTML = '' if ele.innerHTML.length < 3

        px = parseInt(ele.parentNode.getAttribute 'x')
        pw = parseInt(ele.parentNode.getAttribute 'width')
        tw = ele.getBBox().width

        ele.setAttribute 'x', px + (pw / 2 - tw / 2)

    else
      if chart.isCollapsed ele.parentNode
        ele.style.visibility = 'hidden'
        tooltip.innerHTML = datum.key
      else
        ele.style.visibility = 'visible'
        tooltip.innerHTML = ''

      if chart.elipsisRegex.test ele.innerHTML
        ele.innerHTML = chart.removeParentNamesRegex.exec datum.key

      px = parseInt(ele.parentNode.getAttribute 'x')
      pw = parseInt(ele.parentNode.getAttribute 'width')
      tw = ele.getBBox().width

      ele.setAttribute 'x', px + (pw / 2 - tw / 2)
