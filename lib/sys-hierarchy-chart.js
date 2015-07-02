/*
 * System Hierarchy Partition Chart
 */

var SYSTEM_CHART = true;

(function(d3, undefined) {
  var COLLAPSED_SIZE_PIXELS = 10; // size in pixels of collapsed partition
  var DEFAULT_TRANSITION_DURATION = 500; // transition duration millis
  var ROOT_ELEMENT_MAX_FONT_SIZE = 32;
  var MIN_FONT_SIZE = 14;
  var WIDTH_RATIO_ALONE = 0.984;
  var WIDTH_RATIO_COMBINED = 0.885;

  var cw;
  var ch;
  var rangeX;
  var rangeY;
  // matches only a trailing string of alphanumeric characters
  // (includng the underscore character)
  var removeParentNamesRegex = /\w*$/;
  // matches trailing elipsis
  var elipsisRegex = /\.\.\.$/;
  var focusedDatum = null;
  var svg;
  var rootDatum;
  var colors = {
    root: 'rgb(240, 190, 190)',
    group: 'rgb(240, 180, 180)',
    component: 'rgb(180, 180, 240)',
    variable: 'rgb(210, 210, 225)',
    state: 'rgb(210, 240, 180)' // state var and its parent
  };

  window.addEventListener('load', function() {
    var container = document.getElementById('container');

    if (typeof(DEPENDENCIES_CHART) !== 'undefined') {
      cw = window.innerWidth * WIDTH_RATIO_COMBINED;
    } else {
      cw = window.innerWidth * WIDTH_RATIO_ALONE;
    }
    ch = window.innerHeight;
    rangeX = d3.scale.linear().range([0, cw]);
    rangeY = d3.scale.linear().range([0, ch]);

    // create an svg element and append to the container div
    svg = d3.select('#system-hierarchy-chart').append('svg')
      .attr('width', cw)
      .attr('height', ch);

    // create a partition layout and set the getChildren and getValue funcs
    var partition = d3.layout.partition()
      .children(getChildren)
      .sort(function(a, b) {
        return a.siblingOrder - b.siblingOrder;
      })
      // calculates weighted width of a leaf
      // always return 1 so the leaves are all the same size
      .value(function(d) {
        return 1;
      });

    // create svg group elements that correspond to the data nodes
    // and append them to the svg.
    var groups = svg.selectAll('g').data(partition(d3.entries(data.systemHierarchy)[0]))
      .enter().append('g')
      // set the functions that handle resizing and repositioning partitions
      // for zooming, expading, and collapsing
      .attr('x', deltaX)
      .attr('y', deltaY)
      .attr('width', deltaWidth)
      .attr('height', deltaHeight)
      // give each data node a reference to its corresponding svg group
      .each(function(d) {
        d.element = this;
      });

    // set the rootDatum variable
    groups.filter(function(d) {
      return d.parent == null;
    }).each(function(d) {
      rootDatum = d;
    });

    console.log(rootDatum);

    var jsonLowestPlainObjs = (function getLow(data, keyin, out) {
      var hasChildObj = false;
      for (var key in data) {
        if (data[key].constructor.name === 'Object') {
          out = getLow(data[key], key, out);
          hasChildObj = true;
        }
      }
      if (hasChildObj === false) {
        out[keyin] = data;
      }
      return out;
    }(data.systemHierarchy, 'root', {}));

    if (typeof(DEPENDENCIES_CHART) !== 'undefined') {
      var leaf = getDataLeaves(rootDatum)[0];
      ch = leaf.dx * cw * (leaf.depth + 1);
      svg.attr('height', ch);
      rangeY = d3.scale.linear().range([0, ch]);
      transitionAll(10);
    }

    // assign leaves their attribute values from json data
    getDataLeaves(rootDatum).forEach(function(d, i, arr) {
      for (var key in jsonLowestPlainObjs[d.key]) {
        d[key] = jsonLowestPlainObjs[d.key][key];
      }
    });

    // create and append a visible rect for each svg group
    var rects = groups.append('rect')
      .attr('x', deltaX)
      .attr('y', deltaY)
      .attr('width', deltaWidth)
      .attr('height', deltaHeight)
      // colors rects
      .attr('fill', function(d) {
        // root color index is 0 and group color index is 1
        var name = (d.depth === 'group') ? 'root' : 'group';

        // component color index is 2
        if (d.children != null && d.children[0].children == null) {
          name = 'component';
        }

        // variable color index is 3
        if (d.children == null) {
          name = 'variable';
        }

        // state vars and components with state vars color index is 4
        if (d.state != null) {
          name = 'state';
        }
        if (d.children != null) {
          d.children.forEach(function(d, i, arr) {
            if (d.state != null) {
              name = 'state';
            }
          });
        }

        return colors[name];
      });

    // create and append tooltip popup elements
    var titles = groups.append('title');

    // create and append a svg text element for each group
    var texts = groups.append('text')
      .attr('font-size', deltaText)
      // gets the text of a text elementproperty of a data node
      // returns the key
      .text(function(d) {
        return removeParentNamesRegex.exec(d.key);
      })
      // x and y attrs must be last so they run
      // after the bouding box has been computed
      .attr('x', deltaX)
      .attr('y', deltaY)
      .each(handleTextAndTooltips);

    // set row order of data nodes by their screen x position
    var depth = 1;
    var row = getDataByDepth(depth);
    while (row.length > 0) {
      row.sort(function(a, b) {
          return a.x - b.x;
        })
        .forEach(function(ele, i, arr) {
          ele.rowOrder = i;
        });
      row = getDataByDepth(++depth);
    }

    // Set event handlers. Events to communicate outside of system hierarchy chart
    // are emitted from within the handlers.
    svg.selectAll('g').on('click', click);
    svg.selectAll('g').on('contextmenu', click);
    // sets focusedDatum variable to the datum whose svg element has focus
    svg.selectAll('g').on('focus', function(d) {
      focusedDatum = d;
    });

    // Help items
    var helpIconElements = document.getElementsByClassName('help-icon');
    var helpDiv = document.getElementById('help');
    var closeHelpButton = document.getElementById('close-help-button');

    for (var i = 0; i < helpIconElements.length; ++i) {
      helpIconElements.item(i).onclick = function(event) {
        helpDiv.style.display = 'inline-block';
        for (var i = 0; i < helpIconElements.length; ++i) {
          helpIconElements.item(i).style.display = 'none';
        }
        return false;
      };
    }
    closeHelpButton.addEventListener('click', function(event) {
      for (var i = 0; i < helpIconElements.length; ++i) {
        helpIconElements.item(i).style.display = 'block';
      }
      helpDiv.style.display = 'none';
      return false;
    });
  });

  window.addEventListener('resize', function() {
    var container = document.getElementById('container');
    if (container.classList.contains('central-with-sidebar')) {
      cw = window.innerWidth * WIDTH_RATIO_COMBINED;
    } else {
      cw = window.innerWidth * WIDTH_RATIO_ALONE;
    }
    svg.attr('width', cw);
    rangeX.range([0, cw]);

    svg.selectAll('.collapsed').each(function(d) {
      d.dx = (d.dx === 0) ? 0 : COLLAPSED_SIZE_PIXELS / cw;
      deltaWidth.call(this, d);
    });

    setExpandingDx();
    setAllRowPositions();
    transitionAll(10);
  });

  window.addEventListener('zoom', function(event) {
    var detail = event.detail;

    if (detail.rootId === 'system-hierarchy-chart') {
      zoom(detail.datum);

    } else if (detail.secondary === true) {
      var datum = getDataLeaves(rootDatum)[detail.columns[0]];

      while (datum.parent.parent != null && (focusedDatum == null || focusedDatum !== datum.parent)) {
        datum = datum.parent;
      }
      focusedDatum = datum;
      zoom(datum);

      var leaves = getDataLeaves(rootDatum);
      var datumLeaves = getDataLeaves(datum);
      var startIndex = leaves.indexOf(datumLeaves[0]);
      var lastIndex = startIndex + datumLeaves.length;
      var columns = [startIndex, lastIndex];
      // Trigger global event
      var newEvent = new CustomEvent('zoom', {
        detail: {
          rootId: svg[0][0].parentNode.getAttribute('id'),
          root: rootDatum,
          datum: datum,
          element: datum.element,
          rows: [datum.depth, datum.depth + 1],
          columns: columns,
          button: event.button,
          secondary: true
        },
        bubbles: true
      });

      datum.element.dispatchEvent(newEvent);
    }
  });

  window.addEventListener('collapse', function(event) {
    if (event.detail.secondary === true) {
      return;
    }
    var detail = event.detail;
    var datum;

    if (detail.root === rootDatum) {
      datum = detail.datum;
    } else {
      var leaves = getDataLeaves(rootDatum);
      datum = leaves[detail.columns[0]];
    }

    var parent = datum.parent;
    var origDatum = datum;
    while (parent != null) {
      var numExpandedChildren = parent.children.filter(function(d, i, arr) {
        return !d.element.classList.contains('collapsed');
      }).length;

      if (numExpandedChildren === 1) {
        // if parent has no more expanded children, then it becomes the
        // root of the collapse
        datum = parent;
      }
      parent = parent.parent;
    }


    // trigger secondary collapse event if root of the collapse has changed
    if (datum !== origDatum) {
      var leaves = getDataLeaves(rootDatum);
      var datumLeaves = getDataLeaves(datum);
      var startIndex = leaves.indexOf(datumLeaves[0]);
      var lastIndex = startIndex + datumLeaves.length;
      var columns = [startIndex, lastIndex];
      var event = new CustomEvent('collapse', {
        detail: {
          rootId: svg[0][0].parentNode.getAttribute('id'),
          root: rootDatum,
          datum: datum,
          element: datum.element,
          rows: [datum.depth, datum.depth + 1],
          columns: columns,
          secondary: true
        },
        bubbles: true
      });
      datum.element.dispatchEvent(event);
    }

    collapse(datum);
  });

  window.addEventListener('expand', function(event) {
    var detail = event.detail;

    if (event.detail.id === svg[0][0].parentNode.getAttribute('id')) {
      expand(detail.datum);

    } else {
      var leaves = getDataLeaves(rootDatum);
      var columns = detail.columns;

      for (var i = columns[0]; i < columns[1]; ++i) {
        expand(leaves[i]);
      }
    }
  });

  // initiates zooming, collapsing, and expanding
  // emmits the zoom, collapse, and expand events
  function click(datum) {
    var button = d3.event.button;
    var eventType = null;

    // zoom
    if (button === 0 && !datum.element.classList.contains('collapsed')) {
      eventType = 'zoom';

      // expand/collapse
    } else if (button > 0) {
      if (this.classList.contains('collapsed')) {
        eventType = 'expand';

      } else {
        eventType = 'collapse';

        var parent = datum.parent;
        while (parent != null) {
          var numExpandedChildren = parent.children.filter(function(d, i, arr) {
            return !d.element.classList.contains('collapsed');
          }).length;

          if (numExpandedChildren === 1) {
            // if parent has no more expanded children, then it becomes the
            // root of the collapse
            datum = parent;
          }
          parent = parent.parent;
        }
      }
    }

    if (eventType != null) {
      // Trigger global event
      var columns;
      var leaves = getDataLeaves(rootDatum);
      var eleLeaves = getDataLeaves(datum);
      if (eleLeaves.length === 1) {
        if (eleLeaves[0] === datum) {
          columns = [leaves.indexOf(datum), leaves.indexOf(datum) + 1];
        } else {
          columns = [leaves.indexOf(datum.children[0]), leaves.indexOf(datum.children[0]) + 1];
        }
      } else {
        var startIndex = leaves.indexOf(eleLeaves[0]);
        var endIndex = startIndex + eleLeaves.length;
        columns = [startIndex, endIndex];
      }

      var event = new CustomEvent(eventType, {
        detail: {
          rootId: svg[0][0].parentNode.getAttribute('id'),
          root: rootDatum,
          datum: datum,
          element: datum.element,
          rows: [datum.depth, datum.depth + 1],
          columns: columns,
          secondary: false
        },
        bubbles: true
      });
      datum.element.dispatchEvent(event);
    }

    d3.event.preventDefault();
  }

  function zoom(datum) {
    rangeX.domain([datum.x, datum.x + datum.dx]);
    rangeY.domain([datum.y, 1]).range([datum.y ? 20 : 0, ch]);
    transitionAll();
    return datum;
  }

  // determines which elements need to be collapsed and collapses them.
  // repositions the rest of the elements as necessary
  function collapse(datum) {
    if (datum === rootDatum) {
      return;
    }

    var numNotCollapsed = getDataByDepth(datum.depth).filter(function(d, i, arr) {
      return !d.element.classList.contains('collapsed');
    }).length;

    if (numNotCollapsed === 1) {
      return;
    }

    datum.element.classList.add('collapsed');
    var collapsing = d3.select(datum.element)
      .datumDescendantElements(datum)
      .classed('collapsed', true);

    collapsing.each(function(d) {
      if (this.nodeName === 'text') {
        this.style.visibility = 'hidden';
      }

      d.dx = 0;
      var parent = datum;
      while (parent.element.classList.contains('collapsed')) {
        parent.dx = COLLAPSED_SIZE_PIXELS / cw;
        parent = parent.parent;
      }

      d.x = datum.x;
    });

    var child = datum;
    while (child.children != null) {
      var stateVar = null;

      for (var i = 0, len = child.children.length; i < len; ++i) {
        if (child.children[i].state != null) {
          stateVar = child.children[i];
          stateVar.dx = COLLAPSED_SIZE_PIXELS / cw;
          break;
        }
      }

      child.children.forEach(function(d, i, arr) {
        if (stateVar == null && i === 0) {
          d.dx = COLLAPSED_SIZE_PIXELS / cw;

        } else if (d !== stateVar) {
          d.dx = 0;
          d3.select(d.element).datumDescendantElements(d).each(function(d) {
            d.dx = 0;
          });
        }
      });

      child = child.children[0];
    }

    setExpandingDx();
    setAllRowPositions();
    transitionAll();

    return datum;
  }


  // determines which elements need to be expanded and expands them
  // repositions the rest of the elements as necessary
  function expand(datum) {
    d3.select(datum.element)
      .datumChildrenElements(datum)
      .datumDescendantElements(datum)
      .classed('collapsed', false);

    var rootExpansionDatum = (function traverseAncestors(d) {
      var parent = d.parent;
      var parentSelection = d3.select(parent.element);

      if (!parentSelection.classed('collapsed')) {
        return d;
      }

      parentSelection.classed('collapsed', false);

      var numExpandedChildren = parent.children.filter(function(d, i, arr) {
        return !d.element.classList.contains('collapsed');
      }).length;

      if (numExpandedChildren === 1) {
        parent.children.forEach(function(d, i, arr) {
          d3.select(d.element).datumDescendantElements(d).classed('collapsed', false);
        });
      }

      return traverseAncestors(parent);
    }(datum));

    setExpandingDx();
    setAllRowPositions();
    transitionAll();

    return rootExpansionDatum;
  }

  // Set the new size of expanding or resizing elements
  function setExpandingDx() {
    var expanding = svg.selectAll('g').filter(function(d) {
      return !this.classList.contains('collapsed');
    });
    var leaves = getDataLeaves();
    var numExpandedLeaves = 0;
    var numCollapsedAreas = 0;

    leaves.forEach(function(d) {
      if (d.element.classList.contains('collapsed')) {
        if (d.dx !== 0) {
          ++numCollapsedAreas;
        }
      } else {
        ++numExpandedLeaves;
      }
    });

    var unCollapsedArea = cw - numCollapsedAreas * COLLAPSED_SIZE_PIXELS;
    var leafdx = 1 / numExpandedLeaves * unCollapsedArea / cw;

    expanding.each(function(d) {
      if (d.parent == null) {
        return;
      }

      var leaves = getDataLeaves(d);
      var numExpandedLeaves = leaves.filter(function(d, i, arr) {
        return !d.element.classList.contains('collapsed');
      }).length;

      var numCollapsedAreas = 0;

      (function findCollapsedDescendantAreas(d) {
        var children = d.children;

        if (d.children == null) {
          return;

        } else {
          children.forEach(function(child, i, arr) {
            if (child.element.classList.contains('collapsed')) {
              ++numCollapsedAreas;
            } else {
              findCollapsedDescendantAreas(child);
            }
          });
        }
      }(d));

      d.dx = leafdx * numExpandedLeaves + numCollapsedAreas * COLLAPSED_SIZE_PIXELS / cw;
    });
  }

  // sets the x position of all elements
  function setAllRowPositions() {
    svg.selectAll('g').each(function(d) {
      if (d.parent == null) {
        return;
      }
      var laterals = getDataByDepth(d.depth);

      d.newX = 0;
      for (var i = 0, pos = laterals.indexOf(d); i < pos; ++i) {
        d.newX += laterals[i].dx;
      }

    }).each(function(d) {
      if (d.parent == null) {
        return;
      }
      d.x = d.newX;
      delete d.newX;
    });
  }

  // triggers a transition to new sizes and positions
  function transitionAll(duration) {
    duration = duration || DEFAULT_TRANSITION_DURATION;

    svg.selectAll('g, rect, text').transition()
      .duration(duration)
      .attr('x', deltaX)
      .attr('y', deltaY)
      .attr('width', deltaWidth)
      .attr('height', deltaHeight)
      .filter('text')
      .attr('font-size', deltaText)
      .each('end', handleTextAndTooltips);
    logged = false;
  }

  // calculates a change in x position
  function deltaX(d) {
    var newX = 0;

    if (this.nodeName === 'text') {
      var bb = this.getBBox();
      newX = rangeX(d.x) + deltaWidth(d) / 2 - bb.width / 2;

    } else {
      newX = rangeX(d.x);
    }

    return newX;
  }

  // calculates a change in y position
  function deltaY(d) {
    var newY = 0;

    if (this.nodeName === 'text') {
      var bb = this.getBBox();
      newY = rangeY(d.y) + bb.height;

    } else {
      newY = rangeY(d.y);
    }

    return newY;
  }

  // calculates a change in width
  function deltaWidth(d) {
    return rangeX(d.x + d.dx) - rangeX(d.x);
  }

  // calculates a change in height
  function deltaHeight(d) {
    return rangeY(d.y + d.dy) - rangeY(d.y);
  }

  // calculates a change in font size
  function deltaText(d) {
    var height = rootDatum.element.getElementsByTagName('rect')[0].getAttribute('height');
    var rootFontSize = (height * 0.8 > ROOT_ELEMENT_MAX_FONT_SIZE) ? ROOT_ELEMENT_MAX_FONT_SIZE : height * 0.8;
    var newSize = rootFontSize - 0.15 * rootFontSize * d.depth;
    newSize = (newSize < MIN_FONT_SIZE) ? MIN_FONT_SIZE : newSize;

    return newSize;
  }

  // hides a text element that is larger than the rect it lives on
  function handleTextAndTooltips(d) {
    this.innerHTML = removeParentNamesRegex.exec(d.key);

    var gw = this.parentNode.getAttribute('width');
    var tw = this.getBBox().width;
    var siblings = this.parentNode.childNodes;
    var tooltip;
    for (var i = 0; i < siblings.length; ++i) {
      if (siblings.item(i).nodeName === 'title') {
        tooltip = siblings.item(i);
        break;
      }
    }

    if (tw > gw - 10) {
      if (this.parentNode.classList.contains('collapsed')) {
        this.style.visibility = 'hidden';
        tooltip.innerHTML = d.key;
      } else {
        this.style.visibility = 'visible';
        tooltip.innerHTML = '';

        if (elipsisRegex.test(this.innerHTML) === false) {
          this.innerHTML += '...';
        }

        var textLength = this.innerHTML.length - 3;
        while (this.getBBox().width > parseInt(this.parentNode.getAttribute('width')) - 10) {
          if (textLength < 1) {
            this.innerHTML = '...';
            break;
          } else {
            this.innerHTML = this.innerHTML.substr(0, --textLength) + '...';
          }
        }

        if (this.innerHTML.length < 3) {
          this.innerHTML = '';
        }
        var px = parseInt(this.parentNode.getAttribute('x'));
        var pw = parseInt(this.parentNode.getAttribute('width'));
        tw = this.getBBox().width;

        this.setAttribute('x', px + (pw / 2 - tw / 2));
      }
    } else {
      if (this.parentNode.classList.contains('collapsed')) {
        this.style.visibility = 'hidden';
        tooltip.innerHTML = d.key;
      } else {
        this.style.visibility = 'visible';
        tooltip.innerHTML = '';
      }

      if (elipsisRegex.test(this.innerHTML) === true) {
        this.innerHTML = removeParentNamesRegex.exec(d.key);
      }

      var px = parseInt(this.parentNode.getAttribute('x'));
      var pw = parseInt(this.parentNode.getAttribute('width'));
      tw = this.getBBox().width;

      this.setAttribute('x', px + (pw / 2 - tw / 2));
    }
  }

  // algorithm that populates the data graph
  // openmdao system variables are not included in the graph
  function getChildren(d) {
    var vals = d3.entries(d.value);

    vals.forEach(function(ele, i, arr) {
      ele.siblingOrder = i;
    });

    return vals.filter(function(d, i, arr) {
      return d.value.constructor.name === 'Object';
    });
  }

  // returns all data at a particular depth in row order by screen x position
  function getDataByDepth(depth) {
    var data = [];

    svg.selectAll('g').each(function(d) {
      if (d.depth === depth) {
        data.push(d);
      }
    }).sort(function(a, b) {
      return a.rowOrder - b.rowOrder;
    });

    return data;
  }

  // gets all leaves that are decendants of datum
  // !IMPORTANT: This function guarantees leaves are returned in row order,
  // and code that uses this funciton depends on that!
  function getDataLeaves(datum) {
    var leaves = [];
    var selection;

    if (datum == null) {
      selection = svg.selectAll('g');

    } else {
      selection = d3.select(datum.element);
      selection = selection.datumDescendantElements(datum)
        .filter(function(d) {
          return this.nodeName === 'g';
        });
    }

    selection.each(function(d) {
      if (d.children == null) {
        leaves.push(d);
      }
    });

    return leaves;
  }


  // Adds svg elements of a datum's childrewindow.outerWidthn to the selection
  d3.selection.prototype.datumChildrenElements = function(datum) {
    var children = datum.element.children;

    if (children != null) {
      for (var i = 0; i < children.length; ++i) {
        this[0].push(children.item(i));
      }
    }

    return this;
  };

  // adds svg elements of a datum's ancestors to the selection
  d3.selection.prototype.datumAncestorElements = function(datum) {
    while (datum.parent != null) {
      this[0].push(datum.parent.element);
      datum = datum.parent;
    }

    return this;
  };

  // adds svg elements of a datum's descendants to the selection
  d3.selection.prototype.datumDescendantElements = function(datum) {
    (function _pushd(d) {
      var children = d.children;

      if (children != null) {
        for (var i = 0; i < children.length; ++i) {
          this[0].push(children[i].element);
          _pushd.call(this, children[i]);
        }
      }
    }).call(this, datum);

    return this;
  };

  // adds svg elements of a datum's siblings to the selection
  d3.selection.prototype.datumSiblingElements = function(datum) {
    if (datum.parent != null) {
      datum.parent.children.forEach(function(d, i, arr) {
        if (d.element !== datum.element) {
          this[0].push(d.element);
        }
      }, this);
    }
    return this;
  };

}(d3));
