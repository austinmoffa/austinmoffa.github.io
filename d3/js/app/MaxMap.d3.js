var MaxMapD3 = (function() {
    var width = Math.max(960, window.innerWidth);
    var height = Math.max(500, window.innerHeight);
    var data_array = [];

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

    var initZoom = {
        translate: zoom.translate(),
        scale: zoom.scale(),
    }

    var calculatePerformVectorOffset = function() {
        var offset_scale = zoom.scale() / initZoom.scale;

        var offset_translate = [];
        offset_translate[0] = (zoom.translate()[0] - (initZoom.translate[0] * offset_scale));
        offset_translate[1] =  (zoom.translate()[1] - (initZoom.translate[1] * offset_scale));

        vector
        .attr("transform", "translate(" + offset_translate + ")scale(" + offset_scale + ")");
    }
    var init = true;
    function zoomed() {
        var tiles = tile
        .scale(zoom.scale())
        .translate(zoom.translate())
        ();

        calculatePerformVectorOffset();

        if (init) {
            projection
            .scale(zoom.scale() / 2 / Math.PI)
            .translate(zoom.translate());
            init = false;
        }

        var image = raster
        .attr("transform", "scale(" + tiles.scale + ")translate(" + tiles.translate + ")")
        .selectAll("image")
        .data(tiles, function(d) { return d; });

        image.exit()
        .remove();

        image.enter().append("image")
        .attr("xlink:href", function(d) { return "http://" + ["a", "b", "c"][Math.random() * 3 | 0] + ".tile.thunderforest.com/transport/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
        .attr("width", 1)
        .attr("height", 1)
        .attr("x", function(d) { return d[0]; })
        .attr("y", function(d) { return d[1]; });
    }



    var init = function() {
        zoomed();
    }


    var addLayer = function(dataset) {
        data_array.push(dataset);
        addLayerInternal(dataset);
    }

    var addLayerInternal = function(dataset) {
        var data = dataset.layer_data;
        console.log(dataset);
        for (geo in data.objects) {
            var feature = topojson.feature(data, data.objects[geo]);
            vector.append("path")
            .datum(feature)
            .attr("d", d3_simplify(feature))
            .attr('stroke', dataset.style.color)
            .attr('fill', dataset.style.color)
            .attr('stroke-width', '.5')
            .attr('stroke-opacity', dataset.style.opacity)
            .attr('stroke-dasharray', dataset.style.dashArray)
            .attr('fill-opacity', dataset.style.fillOpacity);
        }
    }

   var pushSimplifiedLineArray = function(line, path, tolerance) {
        if(line.length > 10) {
            line = simplify(line, tolerance);
            for (i=0; i<line.length; i++) {
                pathEl.pathSegList.appendItem(line[i]);
            }
        }
    }

    var d3_simplify = function(feature) {
        var d = path(feature);
        pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathEl.setAttribute('d', d);
        var tolerance = 0.5;
        var pathSegArray = [];
        
        for (var i=0; i < pathEl.pathSegList.numberOfItems; i++) {
           pathSegArray.push(pathEl.pathSegList.getItem(i));
        }

        //var newPathArray = simplify(pathSegArray, tolerance);
       var newPathArray = pathSegArray;
        pathEl.pathSegList.clear();
        var lineArray = []; //fill until we hit a nonline, then restart
        var line = true;
        for (i=0; i<newPathArray.length; i++) {
            if (newPathArray[i].x) {
                newPathArray[i].x.toFixed(2);
                newPathArray[i].y.toFixed(2);
                line = true;
            } else {
                line = false;
            }

            if (line) {
                lineArray.push(newPathArray[i]);
            } else { //simplify lines, push new thing
                pushSimplifiedLineArray(lineArray, pathEl, tolerance);
                lineArray = [];
                pathEl.pathSegList.appendItem(newPathArray[i]);
            }
        }
        return pathEl.getAttribute('d');
    }

    return {
        init: init,
        addLayer: addLayer,
    }
})();
