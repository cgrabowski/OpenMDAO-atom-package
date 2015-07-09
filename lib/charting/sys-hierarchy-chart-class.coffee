window.SysHierarchyChart =
class SysHierarchyChart
  defaults:
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

  removeParentNamesRegex: /\w*$/;
  elipsisRegex: /\.\.\.$/;

  constructor: (@data, @config = {}) ->
    for prop, val of @defaults
      @config[prop] = val unless @config[prop]?

    if @config.container?
      @container = @config.container
    else
      @container = document.createElement 'div'
      document.body.appendChild @container

    @chartWidth = @config.chartWidth ? window.innerWidth
    @chartHeight = @config.chartHeight ? window.innerHeight

    @rangeX = d3.scale.linear().range [0, @chartWidth]
    @rangeY = d3.scale.linear().range [0, @chartHeight]

    @svg = d3.select(@container)
      .append('svg')
      .attr('width', @chartWidth)
      .attr('height', @chartHeight)

    @partition = d3.layout.partition()
      .children (datum) ->
        vals = d3.entries datum.value
        vals.forEach (ele, i, arr) -> ele.siblingOrder = i
        vals.filter (datum, i, arr) -> datum.value.constructor.name is 'Object'
      .sort (a, b) -> a.siblingOrder - b.siblingOrder
      .value (datum) -> 1

    @groups = @svg.selectAll('g')
      .data(@partition(d3.entries @data[0]))
      .enter()
      .append('g')
      .each((datum) -> datum.element = @)
      .attr('x', @deltaX)
      .attr('y', @deltaY)
      .attr('width', @deltaWidth)
      .attr('height', @deltaHeight)

    @groups.filter((datum) -> not datum.parent?).each (datum) => @rootDatum = datum

    console.log @rootDatum

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
    ###
    @texts = @groups.append('text')
      .attr('font-size', @deltaText)
      .text((datum) => @removeParentNamesRegex.exec datum.key)
      .attr('x', @deltaX)
      .attr('y', @deltaY)
      .each @handleTextAndTooltips
    ###
    do setRowOrder = (depth = 1) =>
      unless (row = @getDataByDepth depth).length is 0
        ele.rowOrder = i for ele, i in row.sort (a, b) -> a.x - b.x
        setRowOrder ++depth

    @groups.on 'focus', (datum) => @focusedDatum = d
    window.addEventListener 'resize', @resize

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
      for child in d.children
        if d.children?
          selection[0].push child
          pushDatum selection, child
    selection

  addDatumSiblingElements: (selection, datum) ->
    for child in datum.parent.children when datum.parent?
      selection[0].push child.element unless child.element is datum.element

  zooom: (event) ->
    @rangeX.domain([datum.x, datum.x + datum.dx])
    @rangeY.domain([datum.y, 1]).range([if datum.y is 0 then 0 else 20], ch)
    @transitionAll();

  collapse: (datum) ->
    return if datum is rootDatum
    cw = @chartWidth

    numNotCollapsed = (@getDataByDepth(datum.depth).filter (datum, i, arr) ->
      not @isCollapsed d.element).length

    return if numNotCollapsed is 1

    datum.element.classList.add 'collapsed'
    collapsing = @datumDescendantElements(d3.select(datum.element), datum)
      .classed 'collapsed', true

    collapsing.each (d) ->
      this.style.visibility = 'hidden' if this.nodeName is 'text'
      d.dx = 0
      parent = datum
      while @isCollapsed parent.element
        parent.dx = @config.COLLAPSED_SIZE_PIXELS / cw
        parent = parent.parent
      d.x = datum.x

    child = datum
    while child.children?
      stateVar = null
      for c, i in child.children
        if c.state?
          stateVar = c
          stateVar.dx = @config.COLLAPSED_SIZE_PIXELS / cw
          break
      for c, i in child.children
        unless stateVar? or i isnt 0
          d.dx = @config.COLLAPSED_SIZE_PIXELS / cw
        else if stateVar isnt d
          d.dx = 0
          dd.dx = 0 for dd, i in datumDescendantElements(d3.select(d.element), d)
      child = child.children[0]

    @setExpandingDx()
    @setAllRowPositions()
    @transitionAll()

  expand: (datum) ->
    selection = d3.select datum.element
    @datumChildrenElements selection, datum
    @datumDescendantElements selection, datum
    selection.classed 'collapsed', false

    rootExpansionDatum = do traverseAncestors = (d = datum) ->
      parent = d.parent
      parentSelection = d3.select parent.element
      return d unless @isCollapsed parentSelection
      parentSelection.classed 'collapsed', false

      numExpandedChildren =
        (parent.children.filter (dd, i, arr) -> not @isCollapsed dd.element).length

      if numExpandedChildren is 1
        for dd in parent.children
          @datumDescendantElements(d3.select(dd.element), dd).classed 'collapsed', false

      traverseAncestors parent

    @setExpandingDx()
    @setAllRowPositions()
    @transitionAll()

    rootExpansionDatum

  transitionAll: (duration = @config.DEFAULT_TRANSITION_DURATION) ->
    @svg.selectAll('g, rect, text').transition()
      .duration duration
      .attr 'x', @deltaX
      .attr 'y', @deltaY
      .attr 'width', @deltaWidth
      .attr 'height', @deltaHeight
      .filter 'text'
      .attr 'font-size', @deltaText
      .each 'end', @handleTextAndTooltips


  resize: () =>
    @svg.attr 'width', @chartWidth
    @rangeX.range [0, @chartWidth]

    @svg.selectAll '.collapsed'
      .each (d) ->
        d.dx = if d.dx is 0 then 0 else @config.collapsedSizePixels / @chartWidth
        @deltaWidth datum

    @setExpandingDx()
    @setAllRowPositions()
    @transitionAll(10)

  isCollapsed: (element) -> element.classList.contains 'collapsed'

  setExpandingDx: () ->
    expanding = @svg.selectAll('g').filter (d) -> not @isCollapsed this
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
      do findCollapsed = (d) ->
        return unless children = d.children?
        for child in children
          if @isCollapsed child.element then ++numCollapsed else findCollapsed child

      datum.dx = leafdx * numExpandedLeaves + numCollapsedAreas *
        @config.COLLAPSED_SIZE_PIXELS / @chartWidth

  setAllRowPositions: () ->
    @groups.each (datum) ->
      return unless datum.parent?
      laterals = @getDataByDepth datum.depth

      datum.newX = 0;
      for i in [0..laterals.indexOf datum]
        datum.newX += laterals[i].dx

    @groups.each (datum) ->
      return unless datum.parent?
      d.x = datum.newX
      delete datum.newX

  deltaX: (datum) =>
    ele = datum.element
    if ele.nodeName is 'text'
      @rangeX(datum.x) + deltaWidth(datum) / 2 - ele.getBBox().width / 2
    else
      @rangeX datum.x

  deltaY: (datum) =>
    ele = datum.element
    if ele.nodeName is 'text'
      @rangeY(datum.y) + ele.getBBox().height
    else
      @rangeY datum.y

  deltaWidth: (datum) => @rangeX(datum.x + datum.dx) - @rangeX(datum.x)

  deltaHeight: (datum) => @rangeY(datum.y + datum.dy) - @rangeY(datum.y)

  deltaText: (datum) =>
    height = @rootDatum.element.getElementsByTagName('rect')[0].getAttribute 'height'
    rootFontSize =
      if height * 0.8 > @config.ROOT_ELEMENT_MAX_FONT_SIZE
        @config.ROOT_ELEMENT_MAX_FONT_SIZE
      else
        height * 0.8
    calcedSize = rootFontSize - 0.15 * rootFontSize * datum.depth

    if rootFontSize < @config.MIN_FONT_SIZE
      @config.MIN_FONT_SIZE
    else
      calcedSize

  handleTextAndTooltips: (datum) =>
    ele = datum.element
    console.log ele
    ele.innerHTML = @removeParentNamesRegex.exec datum.key
    gw = ele.parentNode.getAttribute 'width'
    tw = ele.getBBox().width
    siblings = ele.parentNode.childNodes
    tooltip = null

    for i in [0..siblings.length - 1]
      console.log siblings
      if siblings.item(i).nodeName is 'title'
        tooltip = siblings.item(i)
        break

    if tw > gw - 10
      if @isCollapsed ele.parentNode
        ele.style.visiblity = 'hidden'
        tooltip.innerHTML = 'datum.key'
      else
        ele.style.visiblity = 'visible'
        tooltip.innerHTML = ''

        this.innerHTML += '...' unless @elipsisRegex.test ele.innerHTML
        textLength = ele.innerHTML.length - 3

        while ele.getBBox().width > parseInt(ele.parentNode.getAtribute 'width') - 10
          if textLength < 1
            ele.innerHTML = '...'
            break
          else
            ele.innerHTML = ele.innerHTML.substr(0, --textLength) + '...'

        ele.innerHTML = '' if ele.innerHTML.length < 3

        px = parseInt(ele.parentNode.getAttribute 'x')
        pw = parseInt(ele.parentNode.getAtribute 'width')
        tw = ele.getBBox().width

        ele.setAttribute 'x', px + (pw / 2 - tw / 2)

    else
      if @isCollapsed ele.parentNode
        ele.style.visibility = 'hidden'
        tooltip.innerHTML = datum.key
      else
        ele.style.visibility = 'visible'
        tooltip.innerHTML = ''

      if @elipsisRegex.test ele.innerHTML
        ele.innerHTML = @removeParentNamesRegex.exec datum.key

      px = parseInt(ele.parentNode.getAtribute 'x')
      pw = parseInt(ele.parentNode.getAtribute 'width')
      tw = ele.getBBox().width

      ele.setAttribute 'x', px + (pw / 2 - tw / 2)
