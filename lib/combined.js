(function(d3, undefined) {


  window.addEventListener('load', function(event) {
    //console.log('combined');
    var svgs = document.getElementById('container').children;

    for (var i = 0; i < svgs.length; ++i) {
      var svg = svgs.item(i);
      //console.log(svg);
      //d3.selectAll('g').attr("transform", "translate(0, 0)scale(1)");
      var zoom = d3.behavior.zoom()
        .scaleExtent([0, 1])
        .on('zoom', function() {
          console.log('zoomed');
          console.log(d3.event);
          d3.selectAll('.container-g').attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        });
      d3.select(svg).call(zoom);
    }
  });

}(d3));
