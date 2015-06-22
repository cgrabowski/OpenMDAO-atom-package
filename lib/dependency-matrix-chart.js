/*
 * Dependency Matrix Chart
 */
(function(d3, undefined) {
  var CHART_SIZE_RATIO = 0.97; // chart to window width/height ratio
  var COLLAPSED_SIZE_PIXELS = 10; // size in pixels of collapsed partition
  var DEFAULT_TRANSITION_DURATION = 500; // transition duration millis

  var ww = window.innerWidth;
  var wh = window.innerHeight;
  var cw = ww * CHART_SIZE_RATIO;
  var ch = wh * CHART_SIZE_RATIO;

  // matches only a trailing string of alphanumeric characters
  // (includng the underscore character)
  var removeParentNamesRegex = /\w*$/;
  // matches trailing elipsis
  var elipsisRegex = /\.\.\.$/;
  var focusedDatum = null;
  var svg;
  var rootDatum;

  window.addEventListener('load', function() {
  });

  // resize svg on window resize
  window.addEventListener('resize', function() {
    ww = window.innerWidth;
    wh = window.innerHeight;
    cw = ww * CHART_SIZE_RATIO;
    ch = wh * CHART_SIZE_RATIO;
    //transitionAll(100);
  });

  function click() {

  }
})(d3);
