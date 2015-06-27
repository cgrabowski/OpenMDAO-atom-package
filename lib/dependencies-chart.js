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
  var nodeLen;
  var cl;
  var focusedDatum = null;
  var rootDatum;
  var colors = [
    'rgb(240, 190, 190)', // root
    'rgb(240, 180, 180)', // group
    'rgb(180, 180, 240)', // component
    'rgb(210, 210, 225)', // variable
    'rgb(210, 240, 180)', // state var and its parent
    'rgb(0, 0, 0)', // black
    'rgb(255, 255, 255)' // white
  ];

  document.addEventListener('readystatechange', function(event) {
    if (document.readyState !== 'complete') {
      return;
    }
    container = document.getElementById('container');
    svgContainer = document.getElementById('dependency-matrix-chart');
    sidebar = document.createElement('div');
    labelSvgContainer = document.createElement('div');

    container.classList.add('central-with-sidebar');
    sidebar.classList.add('sidebar-left');
    labelSvgContainer.classList.add('label-svg-container');
    labelSvgContainer.setAttribute('id', 'label-svg-container');
    sidebar.setAttribute('id', 'label-sidebar');
    document.body.insertBefore(sidebar, container.nextSibling);
    sidebar.appendChild(labelSvgContainer);
  });

  window.addEventListener('load', function() {
    nodeLen = cl / data.dependencies.matrix.length;

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
      var padding = 3 + 'px';
      svgContainer.style.paddingTop = padding;
      labelSvgContainer.style.top = parseInt(sysSvg.getAttribute('height')) + 3 + 'px';
    }

    var labels = data.dependencies.labels.map(function(ele, i, arr) {
      return {
        name: ele,
        x: 0,
        y: i * nodeLen
      };
    });

    var labelGroups = labelSvg.selectAll('g').data(labels)
      .enter().append('g')
      //.attr('fill', 'white')
      .attr('x', function(d) {
        return d.x;
      })
      .attr('y', function(d) {
        return d.y;
      })
      .attr('width', cl / 3)
      .attr('height', nodeLen)
      .each(function(d) {
        d.element = this;
      });

    var texts = labelGroups.append('text')
      .attr('font-size', 13)
      .attr('fill', 'rgb(170, 170, 170)')
      .attr('text-anchor', 'end')
      .attr('style', "font-family: 'Lucida Grande', 'Segoe UI', Ubuntu, Cantarell, sans-serif;")
      .attr('x', function(d) {
        return d.x + parseInt(/[0-9.]*/.exec(window.getComputedStyle(sidebar).width)) - 20;
      })
      .attr('y', function(d) {
        return d.y + nodeLen / 2 + 5;
      })
      .text(function(d) {
        return d.name;
      });

    texts.text(function(d) {
      var name = d.name;
      var sw = labelSvg[0][0].getAttribute('width');
      var tw = this.getBBox().width;

      if (sw < tw) {
        this.textContent = name = name.replace(/.{3}/, '...');
      }
      while(sw < tw) {
        tw = this.getBBox().width;
        this.textContent = name = name.replace(/\.{3}./, '...');
      }

      return name;
    });

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
        acc[i].y = nodeLen * i;
        acc[i].height = nodeLen;
      } else {
        acc[i].push(ele);
      }
      if (i === 0) {
        transpose.push([ele]);
        transpose[j].x = nodeLen * j;
        transpose[j].width = nodeLen;
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
        return (d.value === 1) ? colors[1] : colors[3];
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
  });

  window.addEventListener('zoom', function(event) {
    zoom(event.detail.datum);
  });

  window.addEventListener('collapse', function(event) {
    collapse(event);
  });

  window.addEventListener('expand', function(event) {
    expand(event);
  });

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

  // initiates zooming, collapsing, and expanding
  // emmits the zoom, collapse, and expand events
  function click(datum) {
    var button = d3.event.button;
    var eventType = '';

    // zoom
    //if (button === 0 && !rootDatum.transpose[datum.j].isCollapsed) {
    //  eventType = 'zoom';

    // expand/collapse
    //} else if (button > 0) {
    if (button > 0) { //
      if (rootDatum.transpose[datum.j].isCollapsed) {
        eventType = 'expand';
      } else {
        eventType = 'collapse';
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

  function zoom(event) {}

  function collapse(event) {
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
      var c = COLLAPSED_SIZE_PIXELS;
      col.width = ((target.children != null && i !== 0) || col.width === 0) ? 0 : c;
      col.isCollapsed = true;
    });

    //console.log(event);
    //console.log(columns);

    setExpandingDx();
    setAllRowPositions();
    transitionAll();
  }

  function expand(event) {
    var detail = event.detail;
    var target = detail.target;
    var columns = resolveEventTargetColumns(event);

    columns.forEach(function(col, i, arr) {
      if (col.collapseGroup != null) {
        col.collapseGroup.forEach(function(c, i, arr) {
          c.isCollapsed = false;
          delete c.collapseGroup;
        });
      }
      col.isCollapsed = false;
    });

    setExpandingDx();
    setAllRowPositions();
    transitionAll();
  }

  function setExpandingDx() {
    var collapsedArea = 0;
    var numCollapsedCols = rootDatum.transpose.reduce(function(acc, col) {
      if (col.isCollapsed) {
        collapsedArea += col.width;
        return acc + 1;
      } else {
        return acc;
      }
    }, 0);

    var expandedNodeSize = (cl - collapsedArea) / (rootDatum.transpose.length - numCollapsedCols);

    rootDatum.transpose.forEach(function(col, i, arr) {
      if (!col.isCollapsed) {
        col.width = expandedNodeSize;
      }
    });
  }

  function setAllRowPositions() {
    rootDatum.transpose.forEach(function(col, i, arr) {
      if (i !== 0) {
        col.x = arr[i - 1].x + arr[i - 1].width;
      }
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
  }

  function deltaX(d) {
    return d.x;
  }

  function deltaY(d) {
    return d.y;
  }

  function deltaWidth(d) {
    return d.width;
  }

  function deltaHeight(d) {
    return d.height;
  }

  // resize svg on window resize
  window.addEventListener('resize', function() {
    cl = window.innerWidth * CHART_SIZE_RATIO;
  });

})(d3);
