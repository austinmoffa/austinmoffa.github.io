var data_obj, map_params, numDatasets, layerOrdering, choropleths;
var overlayCount = 0;

var defaultParams = {
    "zoom": 4,
    "centerLat": 44.87144275016589,
    "centerLon": -105.16113281249999,
    "NElat": 67.57571741708057,
    "NElon": -34.27734375,
    "SWlat": 7.885147283424331,
    "SWlon": -176.044921875,
    "report": false,
    "hasBoundingBox": false,
    "hasCenter": false,
    "hasZoom": false //,
    //"base": "Thunderforest Transport"
};
var pn = window.location.pathname;
if (pn.substring(pn.length-5) === "print" ||
    pn.substring(pn.length-6) === "print/" ||
    pn.substring(pn.length-10) === "print.html") {
        defaultParams.report = true;
    }
    // Get and parse query parameters
    var queryParams = parseQueryParams(defaultParams.report);
    // Merge defaults to fill in gaps
    for (var prop in defaultParams) {
        if (defaultParams.hasOwnProperty(prop)) {
            queryParams[prop] = typeof queryParams[prop] == 'undefined'
                ? defaultParams[prop] : queryParams[prop];
        }
    }
    // Store as global location.queryParams
    window.location.queryParams = queryParams;

    // Load base map providers as needed
    var tftransport = L.tileLayer.provider("Thunderforest.Transport");
    var tflandscape = L.tileLayer.provider("Thunderforest.Landscape");
    var osm = L.tileLayer.provider("OpenStreetMap");
    var stamenwc = L.tileLayer.provider("Stamen.Watercolor");
    var base_layers = {
        "Thunderforest Transport": tftransport,
        "Thunderforest Landscape": tflandscape,
        "Open Street Map": osm,
        "Stamen Watercolor": stamenwc
    };

    // Create map
        var map = L.map('map', {
            click: displayPopup,
            scrollWheelZoom: false,
            zoomControl: !window.location.queryParams.report,
            defaultExtentControl: !window.location.queryParams.report,
            attributionControl: false }); // add attribution control after adding disclaimer control below
            if (queryParams.hasBoundingBox) {
                map.fitBounds([[window.location.queryParams.SWlat, window.location.queryParams.SWlon],
                              [window.location.queryParams.NElat, window.location.queryParams.NElon]]);
            } else {
                map.setView([window.location.queryParams.centerLat, window.location.queryParams.centerLon],
                            window.location.queryParams.zoom);
            }

            // Create lists of choropleth overlay layers (to be populated as data is loaded)
            map.summaryOverlays = [];
            map.baselineChoropleths = [];

            if (!window.location.queryParams.report) {
                // Create layers control and add base map to control
                var overlay_groups = {};
                overlay_groups[getLayerCategoryLabel("summary")] = {};
                overlay_groups[getLayerCategoryLabel("initiative")] = {};
                overlay_groups[getLayerCategoryLabel("baseline")] = {};
                var layerControl = L.control.groupedLayers(
                    base_layers, overlay_groups, { exclusiveGroups: [] });
                    layerControl.addTo(map);
                    // For accessibility
                    $("a.leaflet-control-layers-toggle")
                    .prop("title","What's on this map? (Data layers legend and layer information)")
                    .append("<span>What's on this map?</span>");
                    $(".leaflet-control-layers-toggle").on("mouseover", setLayerControlHeight)
                    .on("focus", setLayerControlHeight)
                    .on("touchstart",setLayerControlHeight);
            }

            // Add map event handlers
            map.on("overlayadd", function(e) {
                for (var i = 0; i < numDatasets; i++) {
                    var dataset = layerOrdering[i];
                    if (data_obj.hasOwnProperty(dataset) && e.layer === data_obj[dataset].layer_data) {
                        if (!data_obj[dataset].data_loaded) { loadLayerData(data_obj[dataset]); }
                        if (!window.location.queryParams.report && data_obj[dataset].type === "choropleth") {
                            data_obj[dataset].choroplethLegend.update(e);
                            data_obj[dataset].choroplethLegend.addTo(map);
                        }
                    }
                }
                reorderLayers();
            });

            map.on("overlayremove", function(e) {
                for (var dataset in data_obj) {
                    if (data_obj.hasOwnProperty(dataset) && e.layer === data_obj[dataset].layer_data) {
                        if (!window.location.queryParams.report && data_obj[dataset].type === "choropleth") {
                            map.removeControl(data_obj[dataset].choroplethLegend);
                        }
                    }
                }
            });

            // Add logo, zoom, pan, scale and reset controls to the top left of map
            if (!window.location.queryParams.report) {
                /*
                 */
                new L.Control.ZoomBox().addTo(map);

                // Move zoom controls into a single div container
                var zoomControl = $("div.leaflet-control-zoom.leaflet-bar.leaflet-control");
                var defaultExtentControl = $("div.leaflet-control-defaultextent.leaflet-bar.leaflet-control");
                var zoomBoxControl = $("div.leaflet-zoom-box-control.leaflet-bar.leaflet-control");
                var zoomControlContainer = $("<div></div>").prop("id", "zoomcontrols");
                zoomControlContainer
                .append(defaultExtentControl)
                .append(zoomControl)
                .append(zoomBoxControl);
                $("div.leaflet-top.leaflet-left").prepend(zoomControlContainer);

                new L.Control.Pan({
                    position: 'topleft'
                }).addTo(map);
            }

            L.control.scale({ position: "topleft" }).addTo(map);

            // Add top center location for map controls
            var $controlContainer = map._controlContainer,
                nodes = $controlContainer.childNodes,
                    topCenter = false;

                    for (var i = 0, len = nodes.length; i < len; i++) {
                        var klass = nodes[i].className;
                        if (/leaflet-top/.test(klass) && /leaflet-center/.test(klass)) {
                            topCenter = true;
                            break;
                        }
                    }

                    if (!topCenter) {
                        var tc = document.createElement('div');
                        tc.className += 'leaflet-top leaflet-center';
                        $controlContainer.appendChild(tc);
                        map._controlCorners.topcenter = tc;
                    }

                    if (!window.location.queryParams.report) {
                        // Add popup actions to layers control layer titles
                        addPopupActionsToLayersControlLayerTitles(data_obj, map_params);
                    }

                    $("a.leaflet-control-layers-toggle").on("mouseover", function(e) {
                        if (!window.location.queryParams.report) {
                            // Add popup actions to layers control layer titles
                            addPopupActionsToLayersControlLayerTitles(window.data_obj, window.map_params);
                        }
                    });
