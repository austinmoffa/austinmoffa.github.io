"use strict";
var MaxMapQueryParser = (function() {

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
        "hasZoom": false
    };

    var setBaseLayers = function() {
        var tftransport = L.tileLayer.provider("Thunderforest.Transport");
        var tflandscape = L.tileLayer.provider("Thunderforest.Landscape");
        var osm = L.tileLayer.provider("OpenStreetMap");
        var stamenwc = L.tileLayer.provider("Stamen.Watercolor");
        MaxMap.shared.base_layers = {
            "Thunderforest Transport": tftransport,
            "Thunderforest Landscape": tflandscape,
            "Open Street Map": osm,
            "Stamen Watercolor": stamenwc
        };
    }

    var init = function() {
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
            MaxMap.shared.queryParams = queryParams;
            // Load base map providers as needed

            setBaseLayers();
    }

    function parseQueryParams(defaultGuessIsReport) {
        var queryParams = {};
        var query = decodeURIComponent(window.location.search.substring(1));
        if (query[query.length-1] == '/') {
            query = query.substring(0, query.length-1);
        }
        var vars = query.split("&");
        var results, pair, int_result, float_result;
        for (var i=0;i<vars.length;i++) {
            pair = vars[i].split("=");
            if (typeof pair[1] == 'undefined') {
                results = true;
            } else {
                results = pair[1].split(",");
                if (results.length == 1) {
                    results = results[0];
                    float_result = parseFloat(results);
                    if (!isNaN(float_result)) {
                        int_result = parseInt(results);
                        if (int_result == float_result) {
                            results = int_result;
                        } else {
                            results = float_result;
                        }
                    }
                }
            }
            queryParams[pair[0]] = results;
        }
        if (queryParams.hasOwnProperty("SWlat") &&
            queryParams.hasOwnProperty("SWlon") &&
            queryParams.hasOwnProperty("NElat") &&
                queryParams.hasOwnProperty("NElon")) {
                    queryParams.hasBoundingBox = true;
                }
                if (queryParams.hasOwnProperty("centerLat") &&
                    queryParams.hasOwnProperty("centerLon")) {
                        queryParams.hasCenter = true;
                    }
                    if (queryParams.hasOwnProperty("zoom")) {
                        queryParams.hasZoom = true;
                    }
                    if (!queryParams.hasOwnProperty("hostname")) {
                        queryParams.hostname = window.location.hostname;
                    }
                    if (!queryParams.hasOwnProperty("rootpath")) {
                        var p = window.location.pathname;
                        var n = p.lastIndexOf('/');
                        if (p.length === n + 1) {
                            if ((queryParams.hasOwnProperty("report") && queryParams.report) ||
                                defaultGuessIsReport) {
                                    var nn = p.slice(0, -1).lastIndexOf('/');
                                    queryParams.rootpath = p.slice(0,nn+1);
                                    queryParams.subpath = p.slice(nn+1);
                                } else {
                                    queryParams.rootpath = p;
                                    queryParams.subpath = "";
                                }
                        } else {
                            queryParams.rootpath = p.slice(0,n+1);
                            queryParams.subpath = p.slice(n+1);
                        }
                    }
                    if (!queryParams.hasOwnProperty("subpath")) {
                        queryParams.subpath = "";
                    }
                    return queryParams;
    }


    function getPrintViewPath(map_params) {
        if (window.location.hasOwnProperty("queryParams") &&
            window.location.queryParams.hasOwnProperty("print_url")) {
                return window.location.queryParams.print_url;
            }
            if (map_params.hasOwnProperty("print_url") && map_params.print_url) {
                return map_params.print_url;
            }
            if (window.location.queryParams.hasOwnProperty("hostname") &&
                window.location.queryParams.hasOwnProperty("rootpath") &&
                window.location.queryParams.hasOwnProperty("subpath")) {
                    var hn = window.location.queryParams.hostname;
                    var rp = window.location.queryParams.rootpath;
                    var sp = window.location.queryParams.subpath;
                    return "//"+hn+rp+'print'+(sp.slice(-5) === '.html' ? '.html' : '');
                }
                return "print.html";
    }

    return {
        init: init,
    };
                        })();

