var MaxMapDataProvider = (function() {
        /********************************
         * Data loading functions
         */
    var load_map_data = function(data_format) {
        $.getJSON('data/datasets.json').done(function(obj) {
            map_params = {};
            for (var k in obj) {
                if (obj.hasOwnProperty(k) && k !== 'datasets') {
                    map_params[k] = obj[k];
                }
            }
            data_obj = obj.datasets;
            setupMapControls(map_params);
            numDatasets = datasetCount();
            layerOrdering = [];
            for (k in data_obj) {
                if (data_obj.hasOwnProperty(k)) {
                    data_obj[k].slug = k;
                }
            }
            for (k in data_obj) {
                if (data_obj.hasOwnProperty(k) && data_obj[k].hasOwnProperty("layerOrder")) {
                    layerOrdering[parseInt(data_obj[k]["layerOrder"],10)-1] = k;
                }
            }
            var i;
            // Load each program and add it as an overlay layer to control
            for (i = 0; i < numDatasets; i++) {
                k = layerOrdering[i];
                if (data_obj.hasOwnProperty(k)) {
                    populate_layer_control(data_obj[k], data_format);
                    overlayCount++;
                }
            }
            if (overlayCount === numDatasets) {
                reorderLayers();
                choropleths = getChoropleths();
                if (!window.location.queryParams.report) {
                    // Add check all and uncheck all buttons to overlays selection
                    var overlaysDiv = $("div.leaflet-control-layers-overlays");
                    var baseLayersDiv = $("div.leaflet-control-layers-base");
                    var buttonsDiv = $("<div></div>").addClass("bulk-select-overlays");
                    var selectAllButton = "<button class=\"select-all-overlays\" type=\"button\" onclick=\"addAllLayers()\">Select All</button>";
                    var unselectAllButton = "<button class=\"unselect-all-overlays\" type=\"button\" onclick=\"removeAllLayers()\">Unselect All</button>";
                    buttonsDiv.html(selectAllButton+unselectAllButton);
                    // Add titles to Layers control
                    var baseLayersTitle = $("<div  class=\"leaflet-control-layers-section-name\"></div>")
                    .html("<h4>Base Map Layers</h4>");
                    baseLayersDiv.before(baseLayersTitle);
                    var overlayLayersTitle = $("<div class=\"leaflet-control-layers-section-name\"></div>")
                    .html("<h4>Overlay Layers</h4>")
                    .append(buttonsDiv);
                    overlaysDiv.before(overlayLayersTitle);
                    var titleSpan = "<div><h3 class=\"leaflet-control-layers-title\">"
                    + "<span>What's on this map?</span></h3>"
                    + "<p class=\"leaflet-control-layers-subtitle-info\">"
                    + "<span class=\"fa fa-download\"></span><a href=\""
                    + getAboutDataPath(map_params)
                    + "\" target=\"_blank\">More about these initiatives and data sets</a>"
                    + "</p></div>";
                    $("form.leaflet-control-layers-list").prepend($(titleSpan));
                }
            }
            if (window.location.queryParams.report) {
                // Put location into title of report
                var t = map_params.hasOwnProperty("titleElement") ?
                    $(map_params.titleElement) : $("#content h1");
                    addLocationToReportTitle(t);
            }
            map.invalidateSize(false);
            for (i = 0; i < numDatasets; i++) {
                k = layerOrdering[i];
                if (data_obj.hasOwnProperty(k)) {
                    if (isRequestedDataset(data_obj[k])) {
                        addLayerToMap(data_obj[k]);
                    }
                }
            }
            if (!window.location.queryParams.report) {
                // Add popup actions to layers control layer titles
                addPopupActionsToLayersControlLayerTitles(data_obj, map_params);
            }
            map.invalidateSize(false);
        }).fail(function(e) { map.spin(false); console.log(e); });
    }

    function loadLayerData(dataset, add) {
        add = (typeof add === "undefined") ? false : add;
        if (dataset.hasOwnProperty("data_loaded") && !dataset.data_loaded) {
            switch (dataset.data_format) {
                case "topojson":
                    load_topojson_location_data(dataset, add);
                    break;
                case "geojson":
                    load_geojson_location_data(dataset, add);
                    break;
                default:
                    break;
            }
        }
    }

    function addLayerToMap(dataset) {
        if (dataset.data_loaded) {
            dataset.layer_data.addTo(map);
        } else {
            loadLayerData(dataset, true);
        }
    }

    function populate_layer_control(dataset, data_format) {
        var layerGroup = L.featureGroup();
        dataset.data_format = data_format;
        dataset.data_loaded = false;
        createColorBoxCSS(dataset);
        if (dataset.type === "regions" || dataset.type === "points") {
            dataset.layer_data = layerGroup;
            if (!window.location.queryParams.report) {
                layerControl.addOverlay(dataset.layer_data,
                                        getStyledInitiativeLabel(dataset, "legend"),
                                        getLayerCategoryLabel(dataset.category));
            }
        } else if (dataset.type === "choropleth") {
            if (dataset.category === "summary") {
                map.summaryOverlays.push(dataset.slug);
            }
            if (dataset.category === "baseline") {
                map.baselineChoropleths.push(dataset.slug);
            }
            createChoroplethTools(dataset);
            dataset.layer_data = layerGroup;
            if (!window.location.queryParams.report) {
                layerControl.addOverlay(dataset.layer_data,
                                        getStyledChoroplethLabel(dataset, "legend"),
                                        getLayerCategoryLabel(dataset.category));
            }
        }
    }

    function create_topojson_layer(dataset) {
        var newLayer = new L.TopoJSON();
        if (dataset.type === "regions" || dataset.type === "points") {
            newLayer.setStyle(dataset.style);
            newLayer.options.pointToLayer = function(feature, latlng) {
                var icon_name = dataset.icon ? dataset.icon : 'default';
                smallIcon = CustomMarkers.getMarker(icon_name, dataset.style.color);
                return L.marker(latlng,{icon: smallIcon});
            };
        }
        newLayer.on("mouseover", function(e) {
            var targets = {};
            getSummaryOverlays().map( function(summary) {
                var poly = getLocationsForPointInDataset(e.latlng, data_obj[summary]);
                if (poly.length) { targets[summary] = poly[0]; }
            });
            getBaselineChoropleths().map( function(choro) {
                var poly = getLocationsForPointInDataset(e.latlng, data_obj[choro]);
                if (poly.length) { targets[choro] = poly[0]; }
            });
            for (var overlay in targets) {
                if (targets.hasOwnProperty(overlay)) {
                    if (targets[overlay]) {
                        e.target = targets[overlay];
                        data_obj[overlay].choroplethLegend.update(e);
                    } else {
                        data_obj[overlay].choroplethLegend.update();
                    }
                }
            }
        });
        newLayer.on("mouseout", function(e) {
            getSummaryOverlays().forEach(function(overlay) {
                data_obj[overlay].choroplethLegend.update();
            });
            getBaselineChoropleths().forEach(function(overlay) {
                data_obj[overlay].choroplethLegend.update();
            });
        });
        newLayer.on("click", displayPopup);
        return newLayer;
    }

    function load_topojson_location_data (dataset, add) {
        if (dataset.hasOwnProperty("data_loaded") && !dataset.data_loaded) {
            map.spin(true);
            var layer;
            $.getJSON(dataset.topojson, function(data) {
                var newLayer = create_topojson_layer(dataset);
                newLayer.addData(data);
                newLayer.setStyle(dataset.style);
                if (dataset.type === "choropleth") {
                    for (layer in newLayer._layers) {
                        if (newLayer._layers.hasOwnProperty(layer)) {
                            var theLayer = newLayer._layers[layer];
                            styleChoroplethRegion(dataset, theLayer);
                            addChoroplethRegionEventHandlers(theLayer);
                        }
                    }
                }
                dataset.layer_data.addLayer(newLayer);
                dataset.data_loaded = true;
                if (add) { dataset.layer_data.addTo(map); }
                if (window.location.queryParams.report) {
                    // Populate initiatives report
                    var container = $("div#initiatives");
                    var reportString = populateInitiativesReport();
                    container.html(reportString);
                }
                map.spin(false);
            }, function(e) { map.spin(false); console.log(e); });
        }
    }

    /********************************
     * Data loading functions: IE8 Support
     */
    function load_geojson_location_data (dataset, add) {
        if (dataset.hasOwnProperty("data_loaded") && !dataset.data_loaded) {
            map.spin(true);
            $.getJSON(dataset.geojson, function(data) {
                var newLayer;
                data.features.forEach(function(feature) {
                    newLayer = L.geoJson.css(feature);
                    newLayer.setStyle(data_obj[dataset]["style"]);
                    if (dataset.type === "choropleth") {
                        styleChoroplethRegion(dataset, theLayer);
                        addChoroplethRegionEventHandlers(theLayer);
                    }
                    dataset.layer_data.addLayer(newLayer);
                });
                dataset.data_loaded = true;
                if (add) { dataset.layer_data.addTo(map); }
                if (window.location.queryParams.report) {
                    // Populate initiatives report
                    var container = $("div#initiatives");
                    var reportString = populateInitiativesReport();
                    container.html(reportString);
                }
                map.spin(false);
            }, function(e) { map.spin(false); console.log(e); });
        }
    }

    /********************************
     * Dataset information helpers
     */
    function isRequestedDataset(dataset) {
        if (typeof window.location.queryParams.datasets == 'undefined') {
            if (dataset && dataset.hasOwnProperty("displayed")) {
                return dataset.displayed;
            } else {
                return true;
            }
        }
        if (typeof window.location.queryParams.datasets == "string") {
            return dataset.slug === window.location.queryParams.datasets;
        }
        return ($.inArray(dataset.slug, window.location.queryParams.datasets) !== -1);
    }



    function datasetCount() {
        var n = 0;
        for (var k in data_obj) {
            if (data_obj.hasOwnProperty(k)) n++;
        }
        return n;
    }

    /********************************
     * Geocoding helper functions
     */
    function fixBadAddressData(address) {
        var city = "", county = "", state = "";
        if (address.hasOwnProperty("city")) { city = address.city.trim(); }
        if (address.hasOwnProperty("county")) { county = address.county.trim(); }
        if (address.hasOwnProperty("state")) { state = address.state.trim(); }
        // Fix bad city and state data coming back from geocoding server
        if (state && (state === "penna")) { state = "Pennsylvania"; }
        if (city && (city === "NYC") && state && (state === "New York")) { city = "New York"; }
        if (city && (city === "LA") && state && (state === "California")) { city = "Los Angeles"; }
        if (city && (city === "SF") && state && (state === "California")) { city = "San Francisco"; }
        if (city && (city === "ABQ") && state && (state === "New Mexico")) { city = "Albuquerque"; }
        if (city && (city === "PGH") && state && (state === "Pennsylvania")) { city = "Pittsburgh"; }
        // Display "City of ..." where appropriate
        if (city && ((city.slice(-4).toLowerCase() !== "city")
            || (city.slice(-8).toLowerCase() !== "township"))) { city = "City of " + city; }
        if (city && (city.slice(-10).toLowerCase() === " (city of)")) {
            city = city.slice(0, city.length - 10); }
            return {city: city, county: county, state: state};
    }

    function getReverseGeolocationPromise(latlng) {
        var serviceRequestUrl = map_params.reverse_geocode_service_url+"&lat="+latlng.lat+
            "&lon="+latlng.lng+"&zoom=12&addressdetails=1";
            return $.getJSON(serviceRequestUrl);
    }

    return {
        init: load_map_data,
    }

})();
