/*
 * Dependency Matrix Chart
 */
(function(d3, undefined) {
  var CHART_SIZE_RATIO = 0.97; // chart to window width/height ratio
  var COLLAPSED_SIZE_PIXELS = 10; // size in pixels of collapsed partition
  var DEFAULT_TRANSITION_DURATION = 500; // transition duration millis

  var ww = window.innerWidth;
  var cl = ww * CHART_SIZE_RATIO;
  var nodeLen;
  var range = d3.scale.linear().range([0, cl]);
  var focusedDatum = null;
  var svg;
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

  window.addEventListener('load', function() {
    nodeLen = cl / data.depMatrix.length

    var container = document.getElementById('dependency-matrix-chart');
    if (container.previousElementSibling.children[0].nodeName === 'svg') {
      container.style.paddingTop = nodeLen + 'px';
    }

    svg = d3.select('#dependency-matrix-chart').append('svg')
      .attr('width', cl)
      .attr('height', cl);

    var flat = data.depMatrix.reduce(function(acc, ele) {
      return acc.concat(ele.map(function(ele, i, arr) {
        return {
          value: ele
        };
      }));
    }, []);

    var transpose = [];
    rootDatum = flat.reduce(function(acc, ele, index) {
      var i = ele.i = parseInt(index / data.depMatrix.length);
      var j = ele.j = index % data.depMatrix.length;

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
    if (button === 0 && !rootDatum.transpose[datum.j].isCollapsed) {
      eventType = 'zoom';

      // expand/collapse
    } else if (button > 0) {
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
        button: button
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

    console.log(event);
    var collapseGroup = [];
    columns.forEach(function(col, i, arr) {
      collapseGroup.push(col);
      col.collapseGroup = collapseGroup;
      col.width = (target.children != null && i !== 0) ? 0 : COLLAPSED_SIZE_PIXELS;
      col.isCollapsed = true;
    });

    setExpandingDx();
    setAllRowPositions();
    transitionAll();
  }

  function expand(event) {
    var detail = event.detail;
    var target = detail.target;
    var columns = resolveEventTargetColumns(event);

    columns.forEach(function(col, i, arr) {
      if(col.collapseGroup != null) {
        col.collapseGroup.forEach(function(c, i, arr) {
          c.width = nodeLen;
          delete c.collapseGroup;
        });
      }
      col.width = nodeLen;
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
    ww = window.innerWidth;
    cl = ww * CHART_SIZE_RATIO;
  });

})(d3);
