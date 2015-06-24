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
        transpose[j].width = nodeLen
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
    rootDatum.element = container;

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

  // initiates zooming, collapsing, and expanding
  // emmits the zoom, collapse, and expand events
  function click(datum) {
    var button = d3.event.button;
    var targetDatum = null;
    var eventType = '';

    // zoom
    if (button === 0 && !datum.element.classList.contains('collapsed')) {
      targetDatum = zoom(datum);
      eventType = 'zoom';

      // expand/collapse
    } else if (button > 0) {

      if (this.classList.contains('collapsed')) {
        targetDatum = expand(datum);
        eventType = 'expand';

      } else {
        targetDatum = collapse(datum);
        eventType = 'collapse';
      }
    }

    // Trigger global event
    if (targetDatum != null) {
      var event = new CustomEvent(eventType, {
        detail: {
          rootId: rootDatum.element.getAttribute('id'),
          root: rootDatum,
          datum: targetDatum,
          element: targetDatum.element,
          row: targetDatum.i,
          column: targetDatum.j,
          button: button
        },
        bubbles: true
      });
      targetDatum.element.dispatchEvent(event);
    }

    d3.event.preventDefault();
  }

  function zoom(datum) {
    return datum;
  }

  function collapse(datum) {
    var column = rootDatum.transpose[datum.j];

    column.width = COLLAPSED_SIZE_PIXELS;
    column.forEach(function(d, i, arr) {
      var ele = d.element;
      ele.classList.add('collapsed');
    });

    setExpandingDx();
    setAllRowPositions();
    transitionAll();

    return datum;
  }

  function setExpandingDx() {
    var numCollapsedCols = rootDatum.transpose.reduce(function(acc, col) {
      return (col[0].element.classList.contains('collapsed')) ? acc + 1 : acc;
    }, 0);

    var expandedNodeSize = (cl - numCollapsedCols * 10) / (rootDatum.transpose.length - numCollapsedCols);

    rootDatum.transpose.forEach(function(col, i, arr) {
      if (!col[0].element.classList.contains('collapsed')) {
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

  function expand(datum) {

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
