/*
 * d3 Grid Layout Extension
 *
 * https://github.com/interactivethings/d3-grid
 *
 * Copyright (c) 2013, Jeremy Stucki, Interactive Things
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Neither the name of Jeremy Stucki, Interactive Things nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
(function() {
  d3.layout.grid = function() {
    var mode = "equal",
      layout = _distributeEqually,
      x = d3.scale.ordinal(),
      y = d3.scale.ordinal(),
      size = [1, 1],
      actualSize = [0, 0],
      nodeSize = false,
      bands = false,
      padding = [0, 0],
      cols, rows;

    function grid(nodes) {
      return layout(nodes);
    }

    function _distributeEqually(nodes) {
      var i = -1,
        n = nodes.length,
        _cols = cols ? cols : 0,
        _rows = rows ? rows : 0,
        col, row;

      if (_rows && !_cols) {
        _cols = Math.ceil(n / _rows)
      } else {
        _cols || (_cols = Math.ceil(Math.sqrt(n)));
        _rows || (_rows = Math.ceil(n / _cols));
      }

      if (nodeSize) {
        x.domain(d3.range(_cols)).range(d3.range(0, (size[0] + padding[0]) * _cols, size[0] + padding[0]));
        y.domain(d3.range(_rows)).range(d3.range(0, (size[1] + padding[1]) * _rows, size[1] + padding[1]));
        actualSize[0] = bands ? x(_cols - 1) + size[0] : x(_cols - 1);
        actualSize[1] = bands ? y(_rows - 1) + size[1] : y(_rows - 1);
      } else if (bands) {
        x.domain(d3.range(_cols)).rangeBands([0, size[0]], padding[0], 0);
        y.domain(d3.range(_rows)).rangeBands([0, size[1]], padding[1], 0);
        actualSize[0] = x.rangeBand();
        actualSize[1] = y.rangeBand();
      } else {
        x.domain(d3.range(_cols)).rangePoints([0, size[0]]);
        y.domain(d3.range(_rows)).rangePoints([0, size[1]]);
        actualSize[0] = x(1);
        actualSize[1] = y(1);
      }

      while (++i < n) {
        col = i % _cols;
        row = Math.floor(i / _cols);
        nodes[i].x = x(col);
        nodes[i].y = y(row);
      }

      return nodes;
    }

    grid.size = function(value) {
      if (!arguments.length) return nodeSize ? actualSize : size;
      actualSize = [0, 0];
      nodeSize = (size = value) == null;
      return grid;
    }

    grid.nodeSize = function(value) {
      if (!arguments.length) return nodeSize ? size : actualSize;
      actualSize = [0, 0];
      nodeSize = (size = value) != null;
      return grid;
    }

    grid.rows = function(value) {
      if (!arguments.length) return rows;
      rows = value;
      return grid;
    }

    grid.cols = function(value) {
      if (!arguments.length) return cols;
      cols = value;
      return grid;
    }

    grid.bands = function() {
      bands = true;
      return grid;
    }

    grid.points = function() {
      bands = false;
      return grid;
    }

    grid.padding = function(value) {
      if (!arguments.length) return padding;
      padding = value;
      return grid;
    }

    return grid;
  };
})(); // End d3 Grid Layout Extension

/*
 * Dependency Matrix Chart
 */
(function(d3, undefined) {
  var CHART_SIZE_RATIO = 0.97; // chart to window width/height ratio
  var COLLAPSED_SIZE_PIXELS = 10; // size in pixels of collapsed partition
  var DEFAULT_TRANSITION_DURATION = 500; // transition duration millis

  var ww = window.innerWidth;
  var cl = ww * CHART_SIZE_RATIO;
  var range = d3.scale.linear().range([0, cl]);
  var focusedDatum = null;
  var svg;
  var rootDatum = [];
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
    var grid = d3.layout.grid()
      .bands()
      .size([cl, cl]);

    svg = d3.select('#dependency-matrix-chart').append('svg:svg')
      .attr('width', cl)
      .attr('height', cl)
      .append('g')
      .attr('id', 'dependency-matrix-root');

    var rect = svg.selectAll('rect')
      .data(grid(data.depMatrix.reduce(function(acc, ele) {
        return acc.concat(ele.map(function(ele, i, arr) {
          return {
            value: ele
          };
        }));
      }, [])));

    var flatData = [];
    rect.enter().append('rect')
      .attr('width', grid.nodeSize()[0])
      .attr('height', grid.nodeSize()[0])
      .attr('x', function(d) {
        return d.x;
      })
      .attr('y', function(d) {
        return d.y + 30;
      })
      //.attr("transform", function(d) {
      //  var yOffset = 2 * cl / data.depMatrix.length;
      // return "translate(" + 0 + "," + (d.y + 30) + ")";
      //})
      .attr('fill', function(d) {
        return (d.value === 1) ? colors[1] : colors[3];
      })
      .attr('stroke', 'white')
      .attr('stroke-width', '1')
      .each(function(d) {
        d.element = this;
        d.parent = rootDatum;
        d.dx = d.dy = 1 / data.depMatrix.length;
        flatData.push(d);
      });


    // put the chart data back in multidimensional array format and create index properties
    // Also create the transpose of the chart data for fast column access
    var len = data.depMatrix.length;
    var transpose = rootDatum.transpose = [];
    rootDatum.element = document.getElementById('dependency-matrix-root');

    rootDatum = flatData.reduce(function(acc, ele, index) {
      var i = ele.i = parseInt(index / len);
      var j = ele.j = index % len;

      if (j === 0) {
        var row = [ele];
        acc.push(row);
        row.y = ele.y;
      } else {
        acc[i].push(ele);
      }

      if (i === 0) {
        var column = [ele];
        transpose.push(column);
        column.x = ele.x;
      } else {
        transpose[j].push(ele);
      }

      return acc;
    }, rootDatum);

    console.log(rootDatum);

    svg.selectAll('rect').on('click', click);
    svg.selectAll('rect').on('contextmenu', click);
    svg.selectAll('rect').on('focus', function(d) {
      focusedDatum = d;
    });

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
    }///

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

    column.forEach(function(d, i, arr) {
      d3.select(d.element).classed('collapsed', true);
      d.dx = COLLAPSED_SIZE_PIXELS / cl;
    });

    setExpandingDx();
    setAllRowPositions();
    transitionAll();

    return datum; //
  }

  function setExpandingDx() {
    var expanding = svg.selectAll('rect').filter(function(d) {
      return !this.classList.contains('collapsed');
    });
    var numExpandedColumns = 0;
    var numCollapsedColumns = 0;

    rootDatum.forEach(function(ele, i, arr) {
      if (ele[0].element.classList.contains('collapsed')) {
        if (d.dx !== 0) {
          ++numCollapsedColums;
        }
      } else {
        ++numExpandedColumns; //
      }
    });

    var unCollapsedArea = cl - numCollapsedColumns * COLLAPSED_SIZE_PIXELS;
    var columndx = 1 / numExpandedColumns * unCollapsedArea / cl;
    expanding.each(function(d) {
      d.dx = columndx + numCollapsedColumns * COLLAPSED_SIZE_PIXELS / cl;
    });
  }

  function setAllRowPositions() {
    var row = rootDatum[0];

    rootDatum.transpose.forEach(function(column, index, arr) {
      if (index !== 0) {
        column.x = arr[index - 1].x + column.dx;
      }
      column.forEach(function(ele, i, arr){
        ele.x = arr.x;
      });//
    });
  }

  function transitionAll(duration) {
    duration = duration || DEFAULT_TRANSITION_DURATION;

    svg.selectAll('rect').transition()
      .duration(duration)
      .attr('x', deltaX)
      .attr('y', deltaY)
      .attr('width', deltaWidth)
      .attr('height', deltaHeight); //
  }

  function expand(datum) {
    return datum;
  }

  function deltaX(d) {
    return range(d.x / cl);
  }

  function deltaY(d) {
    return range(d.y / cl) + 30;
  }

  function deltaWidth(d) {
    return range(d.x + d.dx) - range(d.x);
  }

  function deltaHeight(d) {
    return range(d.y + d.dy) - range(d.y);
  }

  // resize svg on window resize
  window.addEventListener('resize', function() {
    ww = window.innerWidth;
    cl = ww * CHART_SIZE_RATIO;
    //transitionAll(100);
  });

})(d3);
