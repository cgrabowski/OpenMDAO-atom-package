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

    //console.log(flat);

    svg.selectAll('g').data(flat).enter()
      .append('g')
      .append('rect')
      .attr('fill', colors[1])
      .attr('x', deltaX)
      .attr('y', deltaY)
      .attr('width', deltaWidth)
      .attr('height', deltaHeight)
      .each(function(d) {
        d.element = this;
      }).transition(1);

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
    } ///

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

  }

  function setExpandingDx() {

  }

  function setAllRowPositions() {

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
