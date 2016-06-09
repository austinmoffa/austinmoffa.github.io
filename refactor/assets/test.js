var test = (function() {
    var foo = 'bar';

    var init = function() {
        console.log(foo);
        this.nestedCall();
    }
    var nestedCall =  function() {
        console.log(foo);
    }

    return {
        init: init,
        nestedCall: nestedCall
    };

})();

test.init();
