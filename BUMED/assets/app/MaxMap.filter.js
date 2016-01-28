var MaxMapFilter = (function() {
    var filter_obj = { //todo, make this a seperate file
        categories: {
            category_1: {
                filter_key: 'MilitaryCategory',
                filter_val: '',
            },
            category_2: {
                filter_key: '',
                filter_val: '',
            },
            category_3: {
                filter_key: 'DisasterType',
                filter_val: '',
            },
            category_4: {
                filter_key: 'NASRAirport',
                filter_val: '',
            },
        },
        config: {

        }
    }
    $('.max-toggle-button').click(function(e) {
        $(this).toggleClass('selected');
        console.log(this);
    });

    $('.max-exclusive-toggle-button').click(function(e) {
        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');
    });

    $('.max-selector').change(function(e) {
        console.log($(this).val());
    });

    return {

    };

})();
