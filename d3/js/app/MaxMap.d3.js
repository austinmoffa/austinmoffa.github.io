var MaxMapD3 = (function() {

    var width = Math.max(960, window.innerWidth);
    var height = Math.max(500, window.innerHeight);

    var tile = d3.geo.tile()
    .size([width, height]);

    var projection = d3.geo.mercator()
    .scale((1 << 12) / 2 / Math.PI)
    .translate([width / 2, height / 2]);

    var center = projection([-100, 40]);

    var path = d3.geo.path()
    .projection(projection);

    var zoom = d3.behavior.zoom()
    .scale(projection.scale() * 2 * Math.PI)
    .scaleExtent([1 << 11, 1 << 14])
    .translate([width - center[0], height - center[1]])
    .on("zoom", zoomed);

    // With the center computed, now adjust the projection such that
    // it uses the zoom behavior’s translate and scale.
    projection
    .scale(1 / 2 / Math.PI)
    .translate([0, 0]);

    var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(zoom);

    var raster = svg.append("g");

    var vector = svg.append("g");

    function zoomed() {
        var tiles = tile
        .scale(zoom.scale())
        .translate(zoom.translate())
        ();

        vector
        .attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
        .style("stroke-width", 1 / zoom.scale());

        var image = raster
        .attr("transform", "scale(" + tiles.scale + ")translate(" + tiles.translate + ")")
        .selectAll("image")
        .data(tiles, function(d) { return d; });

        image.exit()
        .remove();

        image.enter().append("image")
        .attr("xlink:href", function(d) { return "http://" + ["a", "b", "c"][Math.random() * 3 | 0] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
        .attr("width", 1)
        .attr("height", 1)
        .attr("x", function(d) { return d[0]; })
        .attr("y", function(d) { return d[1]; });
    }



    var init = function() {
        zoomed();
    }


    var addLayer = function(dataset) {
        var data = dataset.layer_data;
        for (geo in data.objects) {
            vector
            .append('path')
            .attr("d", path(topojson.mesh(data, data.objects[geo])))
            .attr('fill', dataset.style.color)
            .attr('stroke', dataset.style.color)
     //       .attr('stroke-width', dataset.style.weight)
            .attr('stroke-opacity', dataset.style.opacity)
            .attr('stroke-dasharray', dataset.style.dashArray)
            .attr('fill-opacity', dataset.style.fillOpacity);
           /* vector.append("path")
            .datum(topojson.feature(data, data.objects[geo]))
            .attr("d", d3.geo.path().projection(projection))
            .attr("fill", 'black')
            .attr("name", 'amoffa');*/
        }
    }

    return {
        init: init,
        addLayer: addLayer,
    }
})();
