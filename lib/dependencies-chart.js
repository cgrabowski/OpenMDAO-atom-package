/*
 * Dependency Matrix Chart
 */

var DEPENDENCIES_CHART = true;

(function(d3, undefined) {
  var COLLAPSED_SIZE_PIXELS = 10; // size in pixels of collapsed partition
  var DEFAULT_TRANSITION_DURATION = 500; // transition duration millis
  var CHART_SIZE_RATIO = 0.885;

  var cl = window.innerWidth * CHART_SIZE_RATIO;
  var container;
  var svgContainer;
  var sidebar;
  var labelSvgContainer;
  var svg;
  var labelSvg;
  var labelGroups;
  var texts;
  var nodeWidth;
  var nodeHeight;
  var cl;
  var rangeX;
  var focusedDatum = null;
  var rootDatum;
  var colors = {
    noDependency: 'rgb(240, 180, 180)',
    dependency: 'rgb(210, 210, 225)'
  };

  document.addEventListener('readystatechange', function(event) {
    if (document.readyState !== 'complete') {
      return;
    }
    container = document.getElementById('container');
    svgContainer = document.getElementById('dependency-matrix-chart');
    sidebar = document.createElement('div');
    labelSvgContainer = document.createElement('div');

    container.classList.add('central-with-sidebar');
    if (typeof(SYSTEM_CHART) !== 'undefined') {
      document.body.classList.add('overflow-hidden');
    }
    sidebar.classList.add('sidebar-left');
    labelSvgContainer.classList.add('label-svg-container');
    labelSvgContainer.setAttribute('id', 'label-svg-container');
    sidebar.setAttribute('id', 'label-sidebar');
    document.body.insertBefore(sidebar, container.nextSibling);
    sidebar.appendChild(labelSvgContainer);
  });

  window.addEventListener('load', function() {
    nodeWidth = cl / data.dependencies.matrix.length;
    nodeHeight = cl / data.dependencies.matrix.length;
    rangeX = d3.scale.linear().range([0, cl]);

    svg = d3.select('#dependency-matrix-chart').append('svg')
      .attr('width', cl)
      .attr('height', cl);

    labelSvg = d3.select('#label-svg-container').append('svg')
      .attr('width', function(d) {
        return parseInt(/[0-9.]*/.exec(window.getComputedStyle(sidebar).width)) - 10;
      })
      .attr('height', cl);

    var sysSvg = svgContainer.previousElementSibling.children[0];
    if (sysSvg != null && sysSvg.nodeName === 'svg') {
      var padding = 5 + 'px';
      svgContainer.style.paddingTop = padding;
      labelSvgContainer.style.top = parseInt(sysSvg.getAttribute('height')) + 3 + 'px';
    }

    var labels = data.dependencies.labels.map(function(ele, i, arr) {
      return {
        name: ele,
        i: i,
        x: 0,
        y: i * nodeHeight + nodeHeight / 2 + 7
      };
    });

    labelGroups = labelSvg.selectAll('g').data(labels)
      .enter().append('g')
      //.attr('fill', 'white')
      .attr('x', function(d) {
        return d.x;
      })
      .attr('y', function(d) {
        return d.y;
      })
      .attr('width', cl / 3)
      .each(function(d) {
        d.element = this;
      });

    texts = labelGroups.append('text')
      .attr('font-size', 13)
      .attr('fill', 'rgb(170, 170, 170)')
      .attr('text-anchor', 'end')
      .attr('style', "font-family: 'Lucida Grande', 'Segoe UI', Ubuntu, Cantarell, sans-serif;")
      .attr('x', function(d) {
        return d.x + parseInt(/[0-9.]*/.exec(window.getComputedStyle(sidebar).width)) - 20;
      })
      .attr('y', function(d) {
        return d.y;
      })
      .text(deltaText);

    var flat = data.dependencies.matrix.reduce(function(acc, ele) {
      return acc.concat(ele.map(function(ele, i, arr) {
        return {
          value: ele
        };
      }));
    }, []);

    var transpose = [];
    rootDatum = flat.reduce(function(acc, ele, index) {
      var i = ele.i = parseInt(index / data.dependencies.matrix.length);
      var j = ele.j = index % data.dependencies.matrix.length;

      if (j === 0) {
        acc.push([ele]);
        acc[i].y = nodeHeight * i;
        acc[i].height = nodeHeight;
        acc[i].isCollapsed = false;
      } else {
        acc[i].push(ele);
      }
      if (i === 0) {
        transpose.push([ele]);
        transpose[j].x = nodeWidth * j;
        transpose[j].width = nodeWidth;
        transpose[j].isCollapsed = false;
      } else {
        transpose[j].push(ele);
      }

      Object.defineProperty(ele, 'x', {
        get: function() {
          return transpose[j].x;
        },
        set: function(x) {
          transpose[j].x = x;
        },
        enumerable: true
      });

      Object.defineProperty(ele, 'y', {
        get: function() {
          return acc[i].y;
        },
        set: function(y) {
          acc[i].y = y;
        },
        enumerable: true
      });

      Object.defineProperty(ele, 'width', {
        get: function() {
          return transpose[j].width;
        },
        set: function(width) {
          transpose[j].width = width;
        },
        enumerable: true
      });

      Object.defineProperty(ele, 'height', {
        get: function() {
          return acc[i].height;
        },
        set: function(height) {
          acc[i].height = height;
        },
        enumerable: true
      });

      return acc;
    }, []);

    rootDatum.transpose = transpose;

    svg.selectAll('g').data(flat).enter()
      .append('g')
      .append('rect')
      .attr('fill', function(d) {
        return (d.value === 1) ? colors['noDependency'] : colors['dependency'];
      })
      .attr('x', deltaX)
      .attr('y', deltaY)
      .attr('width', deltaWidth)
      .attr('height', deltaHeight)
      .each(function(d) {
        d.element = this;
      })
      .on('click', click)
      .on('contextmenu', click)
      .on('focus', function(d) {
        focusedDatum = d;
      });

    console.log(rootDatum);
    console.log(labelGroups);
  });

  // resize svg on window resize
  window.addEventListener('resize', function() {
    cl = window.innerWidth * CHART_SIZE_RATIO;
    svg[0][0].setAttribute('width', cl);
    rangeX.range([0, cl]);

    setExpandingDx();
    setAllPositions();

    labelSvg[0][0].setAttribute('width', parseInt(/[0-9.]*/.exec(window.getComputedStyle(sidebar).width)) - 20);
    d3.selectAll(texts[0]).transition()
      .duration(10)
      .attr('x', function(d) {
        var newX = d.x + parseInt(/[0-9.]*/.exec(window.getComputedStyle(sidebar).width)) - 20;
        return newX;
      })
      .text(deltaText);

    transitionAll(10);
  });

  window.addEventListener('zoom', function(event) {
    zoom(event);
  });

  window.addEventListener('collapse-row', function(event) {
    collapseRow(event);
  });

  window.addEventListener('collapse', function(event) {
    var datum = event.detail.datum;
    if (datum.key == null || datum.key !== 'root') {
      collapseColumn(event);
    }
  });

  window.addEventListener('expand-row', function(event) {
    expandRow(event);
  });

  window.addEventListener('expand', function(event) {
    expandColumn(event);
  });

  if (typeof(SYSTEM_CHART) !== 'undefined') {
    window.addEventListener('wheel', function(event) {
      wheel(event);
    });
  }

  function resolveEventTargetColumns(event) {
    var targetCols = [];
    var eventColIndices = event.detail.columns;

    for (var i = eventColIndices[0]; i < eventColIndices[1]; ++i) {
      //console.log(i);
      //console.log(rootDatum.transpose[i]);
      targetCols.push(rootDatum.transpose[i]);
    }

    return targetCols;
  }

  function wheel(event) {
    event.preventDefault();
    var up = event.deltaY > 0;
    var root = rootDatum;

    if ((!up && root[0].y < -nodeHeight + 1) || (up && root[root.length - 1].y > nodeHeight)) {
      svg.selectAll('g, rect').transition(DEFAULT_TRANSITION_DURATION)
        .attr('y', function(d) {
          if (d.j === 0) {
            d.y += (up) ? -nodeHeight / 2 : nodeHeight / 2;
          }

          return d.y;
        });

      labelSvg.selectAll('text').transition(DEFAULT_TRANSITION_DURATION)
        .attr('y', function(d) {
          if (up) {
            d.y -= nodeHeight;
          } else {
            d.y += nodeHeight;
          }
          return d.y;
        });
    }
  }

  // initiates zooming, collapsing, and expanding
  // emmits the zoom, collapse, and expand events
  function click(datum) {
    var button = d3.event.button;
    var eventType = '';

    // zoom
    if (button === 0 && !rootDatum.transpose[datum.j].isCollapsed) {
      eventType = 'zoom';

      // expand/collapse
    } else if (button > 0) {
      if (rootDatum[datum.i].isCollapsed) {
        eventType = 'expand-row';
      } else {
        eventType = 'collapse-row';
      }
    }

    // Trigger global event
    var event = new CustomEvent(eventType, {
      detail: {
        rootId: svg[0][0].parentNode.getAttribute('id'),
        root: rootDatum,
        datum: datum,
        element: datum.element,
        rows: [datum.i, datum.i + 1],
        columns: [datum.j, datum.j + 1],
        button: button,
        secondary: false
      },
      bubbles: true
    });
    datum.element.dispatchEvent(event);

    d3.event.preventDefault();
  }

  function zoom(event) {
    var detail = event.detail;

    if (detail.rootId === 'dependency-matrix-chart' && typeof(SYSTEM_CHART) !== 'undefined' && detail.secondary === false) {
      var datum = detail.datum;
      // Trigger global event
      var event = new CustomEvent('zoom', {
        detail: {
          rootId: svg[0][0].parentNode.getAttribute('id'),
          root: rootDatum,
          datum: datum,
          element: datum.element,
          rows: [datum.i, datum.i + 1],
          columns: [datum.j, datum.j + 1],
          button: event.button,
          secondary: true
        },
        bubbles: true
      });

      datum.element.dispatchEvent(event);

    } else if (detail.rootId === 'system-hierarchy-chart') {
      var datum = detail.datum;
      rangeX = d3.scale.linear().domain([datum.x, datum.x + datum.dx]).range([0, cl]);

      svg.selectAll('g, rect, text').transition()
        .duration(DEFAULT_TRANSITION_DURATION)
        .attr('x', function(d) {
          return rangeX(d.x / cl);
        })
        .attr('width', function(d) {
          return (detail.columns.length - 1) * cl;
        });

    }
  }

  function collapseRow(event) {
    var datum = event.detail.datum;

    var numCollapsedRows = rootDatum.reduce(function(acc, ele) {
      return (ele.isCollapsed) ? acc + 1 : acc;
    }, 0);

    if (numCollapsedRows === rootDatum.transpose.length - 1) {
      return;
    }

    rootDatum[datum.i].isCollapsed = true;
    rootDatum[datum.i].height = COLLAPSED_SIZE_PIXELS;
    texts[0][datum.i].setAttribute('visibility', 'hidden');

    setExpandingDx();
    setAllPositions();
    transitionAll();
  }

  function collapseColumn(event) {
    var detail = event.detail;
    var target = detail.element;
    var columns = resolveEventTargetColumns(event);

    var numCollapsedCols = rootDatum.transpose.reduce(function(acc, ele) {
      return (ele.isCollapsed) ? acc + 1 : acc;
    }, 0);

    if (numCollapsedCols === rootDatum.transpose.length - 1) {
      return;
    }

    var collapseGroup = [];
    columns.forEach(function(col, i, arr) {
      collapseGroup.push(col);
      col.collapseGroup = collapseGroup;
      col.width = ((target.children != null && i !== 0) || col.width === 0) ? 0 : COLLAPSED_SIZE_PIXELS;
      col.isCollapsed = true;
      //texts[0][rootDatum.transpose.indexOf(col)].setAttribute('visibility', 'hidden');
    });

    setExpandingDx();
    setAllPositions();
    transitionAll();
  }

  function expandRow(event) {
    var detail = event.detail;
    var target = detail.datum;
    var row = rootDatum[target.i];

    row.isCollapsed = false;
    texts[0][target.i].setAttribute('visibility', 'visible');

    setExpandingDx();
    setAllPositions();
    transitionAll();
  }

  function expandColumn(event) {
    var detail = event.detail;
    var target = detail.target;
    var columns = resolveEventTargetColumns(event);

    columns.forEach(function(col, i, arr) {
      if (col.collapseGroup != null) {
        col.collapseGroup.forEach(function(c, i, arr) {
          c.isCollapsed = false;
          delete c.collapseGroup;
          //texts[0][rootDatum.transpose.indexOf(c)].setAttribute('visibility', 'visible');
        });
      }
      //texts[0][rootDatum.transpose.indexOf(col)].setAttribute('visibility', 'visible');
      col.isCollapsed = false;
    });

    setExpandingDx();
    setAllPositions();
    transitionAll();
  }

  function setExpandingDx() {
    var collapsedColumnLen = 0;
    var numCollapsedCols = rootDatum.transpose.reduce(function(acc, col) {
      if (col.isCollapsed) {
        collapsedColumnLen += col.width;
        return acc + 1;
      } else {
        return acc;
      }
    }, 0);

    nodeWidth = (cl - collapsedColumnLen) / (rootDatum.transpose.length - numCollapsedCols);

    rootDatum.transpose.forEach(function(col, i, arr) {
      if (!col.isCollapsed) {
        col.width = nodeWidth;
      }
    });

    rootDatum.forEach(function(row, i, arr) {
      if (!row.isCollapsed) {
        row.height = nodeHeight;
      }
    });
  }

  function setAllPositions() {
    rootDatum.transpose.forEach(function(col, j, arr) {
      if (j !== 0) {
        col.x = arr[j - 1].x + arr[j - 1].width;
      }
    });

    rootDatum.forEach(function(row, i, arr) {
      if (i !== 0) {
        row.y = arr[i - 1].y + arr[i - 1].height;
      }
      var fontSize = parseInt(texts[0][i].getAttribute('font-size'));
      texts[0][i].__data__.y = row.y + nodeWidth / 2 + fontSize / 2 + rootDatum[0].y;
    });
  }

  function transitionAll(duration) {
    duration = duration || DEFAULT_TRANSITION_DURATION;

    svg.selectAll('rect').transition()
      .duration(duration)
      .attr('x', deltaX)
      .attr('y', deltaY)
      .attr('width', deltaWidth)
      .attr('height', deltaHeight);

    texts.transition()
      .duration(duration)
      .attr('y', deltaY);
  }

  function deltaX(d) {
    return rangeX(d.x / cl);
  }

  function deltaY(d) {
    return d.y;
  }

  function deltaWidth(d) {
    return rangeX(d.width / cl + d.x / cl) - rangeX(d.x / cl);
  }

  function deltaHeight(d) {
    return d.height;
  }

  function deltaText(d) {
    this.textContent = d.name;
    var sw = parseInt(labelSvg[0][0].getAttribute('width'));
    var tw = this.getBBox().width;

    if (sw < tw) {
      this.textContent = this.textContent.replace(/.{3}/, '...');
    }
    while (sw < tw) {
      tw = this.getBBox().width;
      this.textContent = this.textContent.replace(/\.{3}./, '...');
    }

    return this.textContent;
  }

})(d3);
