var MaxMapDriver = (function() {

    var initChildrenSharedVars = function() {

        MaxMap.providers.display.initSharedVars(); //create map
        MaxMap.providers.layers.initSharedVars(); //create map
        MaxMap.providers.map.initSharedVars(); //create map

    }
    var init = function() {
        MaxMap.providers.query.init(); //setting our queryParams
        MaxMap.shared.map = MaxMap.providers.map.createMap(); //create map

        initChildrenSharedVars(); //once map is initialized, we can init for all children - all references defined by now

        MaxMap.providers.map.configMap(); //create map
        MaxMap.providers.data.init('topojson'); //load data into map
    }
    return {
        init: init,
    };
})();
