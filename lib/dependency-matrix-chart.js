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
})();

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
    var nodeLen = cl / data.depMatrix.length;

    var grid = d3.layout.grid()
      .bands()
      .size([cl, cl])
      .padding([0.05, 0.05]);

    svg = d3.select('#dependency-matrix-chart').append('svg:svg')
      .attr('width', cl)
      .attr('height', cl)
      .append('g');
      //.attr("transform", "translate(70,70)");

    var rects = [];
    var rect = svg.selectAll(".rect")
      .data(grid(data.depMatrix.reduce(function(acc, ele) {
        return acc.concat(ele.map(function(ele, i, arr) {
          return {
            value: ele
          };
        }));
      }, [])));

    rect.enter().append('rect')
      .attr('width', grid.nodeSize()[0])
      .attr('height', grid.nodeSize()[0])
      .attr("transform", function(d) {
        var yOffset = 2 * cl / data.depMatrix.length;
        return "translate(" + d.x + "," + (d.y + 30) + ")";
      })
      .attr('fill', function(d) {
        return (d.value === 1) ? colors[5] : colors[3];
      });

  });

  function deltaX(d) {
    return range(d.x);
  }

  function deltaY(d) {
    return range(d.y);
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

  function click() {

  }
})(d3);
