"use strict";
var MaxMapLeaflet = (function() {
    var queryParams, providers, base_layers, map, data_obj, map_params;

    var initSharedVars = function() { //convenience function
        queryParams = MaxMap.shared.queryParams;
        providers = MaxMap.providers;
        base_layers = MaxMap.shared.base_layers;
        map = MaxMap.shared.map;
        data_obj = MaxMap.shared.data_obj;
        map_params = MaxMap.shared.map_params;
    }

    var createMap = function() {
        return L.map('map', {
            click: MaxMap.providers.display.displayPopup,
            scrollWheelZoom: false,
            zoomControl: !MaxMap.shared.queryParams.report,
            defaultExtentControl: !MaxMap.shared.queryParams.report,
            attributionControl: false,
        }); // add attribution control after adding disclaimer control below
    }

    var createLayerControls = function() {
        queryParams = MaxMap.shared.queryParams;
        providers = MaxMap.providers;
        map = MaxMap.shared.map;
        base_layers = MaxMap.shared.base_layers;
        if (!queryParams.report) {
            // Create layers control and add base map to control
            var overlay_groups = {};
            overlay_groups[providers.display.getLayerCategoryLabel("summary")] = {};
            overlay_groups[providers.display.getLayerCategoryLabel("initiative")] = {};
            overlay_groups[providers.display.getLayerCategoryLabel("baseline")] = {};
            return L.control.groupedLayers(
                base_layers, overlay_groups, { exclusiveGroups: [] });
                layerControl.addTo(map);
                // For accessibility
                $("a.leaflet-control-layers-toggle")
                .prop("title","What's on this map? (Data layers legend and layer information)")
                .append("<span>What's on this map?</span>");
                $(".leaflet-control-layers-toggle").on("mouseover", providers.layers.setLayerControlHeight)
                .on("focus", providers.layers.setLayerControlHeight)
                .on("touchstart", providers.layers.setLayerControlHeight);
        }


    }

    var configMap = function() {
        if (queryParams.hasBoundingBox) {
            map.fitBounds([[queryParams.SWlat, queryParams.SWlon],
                          [queryParams.NElat, queryParams.NElon]]);
        } else {
            map.setView([queryParams.centerLat, queryParams.centerLon],
                        queryParams.zoom);
        }

        // Create lists of choropleth overlay layers (to be populated as data is loaded)
        map.summaryOverlays = [];
        map.baselineChoropleths = [];

        // Add map event handlers
        map.on("overlayadd", function(e) {
            for (var i = 0; i < numDatasets; i++) {
                var dataset = layerOrdering[i];
                if (data_obj.hasOwnProperty(dataset) && e.layer === data_obj[dataset].layer_data) {
                    if (!data_obj[dataset].data_loaded) { loadLayerData(data_obj[dataset]); }
                    if (!queryParams.report && data_obj[dataset].type === "choropleth") {
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
                    if (!queryParams.report && data_obj[dataset].type === "choropleth") {
                        map.removeControl(data_obj[dataset].choroplethLegend);
                    }
                }
            }
        });

        // Add logo, zoom, pan, scale and reset controls to the top left of map
        if (!queryParams.report) {
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

                if (!queryParams.report) {
                    // Add popup actions to layers control layer titles
                    providers.layers.addPopupActionsToLayersControlLayerTitles(data_obj, map_params);
                }

                $("a.leaflet-control-layers-toggle").on("mouseover", function(e) {
                    if (!queryParams.report) {
                        // Add popup actions to layers control layer titles
                        providers.layers.addPopupActionsToLayersControlLayerTitles(window.data_obj, window.map_params);
                    }
                });


    }
    return {
        createLayerControls: createLayerControls,
        createMap: createMap,
        configMap: configMap,
        initSharedVars: initSharedVars,
    }
})();
