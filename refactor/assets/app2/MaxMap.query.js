/********************************
 * Handle query parameters & path utilities
 */
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

function getAboutDataPath(map_params) {
    if (window.location.hasOwnProperty("queryParams") &&
        window.location.queryParams.hasOwnProperty("about_data_url")) {
        return window.location.queryParams.about_data_url;
    }
    if (map_params.hasOwnProperty("about_data_url") && map_params.about_data_url) {
        return map_params.about_data_url;
    }
    if (window.location.queryParams.hasOwnProperty("hostname") &&
        window.location.queryParams.hasOwnProperty("rootpath") &&
        window.location.queryParams.hasOwnProperty("subpath")) {
        var hn = window.location.queryParams.hostname;
        var rp = window.location.queryParams.rootpath;
        var sp = window.location.queryParams.subpath;
        return "//"+hn+rp+'datasets'+(sp.slice(-5) === '.html' ? '.html' : '');
    }
    return "datasets.html";
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


