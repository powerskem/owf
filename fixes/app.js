
var Map = {
    
    defaults: { 
        center: new google.maps.LatLng(38.901721, -77.035841),
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    },

    el: null,
    directionsEl: null,

    instance: null,

    directionsService: null,
    directionsDisplay: null,
    directionResponse: null,

    directionTemplate: Handlebars.compile($('#directions-template').html()),
    infoTemplate: Handlebars.compile($('#info-template').html()),

    isPrinting: false,

    markers: [],

    state: {
        addresses: null,
        markers: null,
        bounds: null
    },

    initialize: function(el, directionsEl) {
        var thismap = this;
        thismap.el = el;
        thismap.directionsEl = directionsEl;

        //KEP TODO Enable each map to have unique marker lists
        thismap.state.addresses = [];
        thismap.state.markers = [];
        thismap.state.bounds = {};

        //KEP TODO Does this reset the zoom when reloading the page?
        thismap.instance = new google.maps.Map(el, thismap.defaults);

        thismap.directionsService = new google.maps.DirectionsService();

        thismap.directionsDisplay = new google.maps.DirectionsRenderer();
        thismap.directionsDisplay.setMap(thismap.instance);

        thismap.geocoder = new google.maps.Geocoder();

        var timeoutId;
        google.maps.event.addListener(thismap.instance, 'bounds_changed', function(event) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout( function() {
                
                var bounds = thismap.instance.getBounds();

                // update state's bound object
                thismap.state.bounds =  {
                    ne: {
                        lat: bounds.getNorthEast().lat(),
                        lng: bounds.getNorthEast().lng()
                    },
                    sw: {
                        lat: bounds.getSouthWest().lat(),
                        lng: bounds.getSouthWest().lng()
                    }
                }

                thismap.save();

            }, 500 );
        });

        $.subscribe( 'marker:add', $.proxy(thismap.onMarkerAdded, thismap) );

        $.subscribe( 'navigate', function(e, start, end) {
            thismap.clearMarkers();

            thismap.state.addresses = [start, end];
            thismap.state.markers = [];
        });
    },

    setState: function (state) { // This is called by OWF.Preferences.getUserPreference
        var thismap = this;
        thismap.clear();

        // In the jquery.extend method,
        // 'True' makes it RECURSIVE, so that objects are recursively merged...
        // ...but the empty target object causes state to be preserved anyway.
        thismap.state = $.extend(true, {}, state); 

        if(state.addresses && state.addresses.length > 0) {
            Map.getDirections(state.addresses[0], state.addresses[1]);
        }
        else if(state.markers) {
            console.log('KEP in setState', state.markers.length, ' state.markers');
            console.log('KEP in setState', thismap.state.markers.length, ' thismap.state.markers');
            console.log('KEP in setState', thismap.markers.length, ' thismap.markers');

            for (var i = 0, len = state.markers.length; i < len; i++) {
                Map.placeMarker(state.markers[i]);
            }
        }

        if(state.bounds) {
            var sw = state.bounds.sw,
                ne = state.bounds.ne;

            if(state.bounds.ne && state.bounds.sw) {
                thismap.instance.panToBounds(new google.maps.LatLngBounds(
                    new google.maps.LatLng( sw.lat, sw.lng ),
                    new google.maps.LatLng( ne.lat, ne.lng )
                ));
            }
        }

    },

    codeAddress: function(address) {
        var thismap = this;
        console.log('coding address', address);
        var deferred = jQuery.Deferred();

        thismap.geocoder.geocode({
            'address': address
            //KEP TODO save new bounds after zoom action
            // , bounds: thismap.instance.getBounds()
        }, function(response, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                deferred.resolve(response)
            }
            else {  
            }
        });

        return deferred.promise();
    },

    clearMarker: function(obj) {
        var thismap = this,
            address = obj.address;

        thismap.codeAddress(address).then(function(response) {
            var location = response[0].geometry.location,
                marker;

            for (var i = len = thismap.markers.length - 1; i >= 0 ; i--) {
                marker = thismap.markers[i];
                if(marker.getPosition().equals(location)) {
                    marker.setMap(null);

                    //remove the marker from the array
                    thismap.markers.splice(i, 1); 
                    break;
                }
            }

            for (var i = len = thismap.state.markers.length - 1; i >= 0 ; i--) {
                marker = thismap.state.markers[i];
                if(marker.address == address) {

                    //remove the marker from the array
                    thismap.state.markers.splice(i, 1); 
                    break;
                }
            }
        });

        thismap.save();

    },

    placeMarker: function(obj) {
        var thismap = this,
            address = obj.address;

        thismap.directionsDisplay.setMap(null);

        thismap.codeAddress(address).then(function(response) {
            var location = response[0].geometry.location,
                markerFound = false,
                marker;

            for (var i = 0, len = thismap.markers.length; i < len; i++) {
                marker = thismap.markers[i];
                if(marker.getPosition().equals(location)) {
                    markerFound = true;
                    break;
                }
            }

            if(markerFound !== true) {
                var newMarker = new google.maps.Marker({
                    //icon:'pinkball.png', //KEP TODO Use a special icon for ISR loc
                    map: thismap.instance,
                    position: location
                });

                $.publish('marker:add', [newMarker, obj]);
            }
            
            //thismap.instance.setZoom(5); //KEP TODO Set zoom diff for ea window
            thismap.instance.panTo(location);

            $.publish('marker:pan', obj);
        });
    },

    onMarkerAdded: function (e, marker, obj) {
        var thismap = this;
        thismap.state.addresses = [];

        thismap.markers.push(marker);

        // Before pushing address, check whether it's already in thismap.state.markers array
        var address = obj.address;
        var markerFound = false;
        for (var i = 0, len = thismap.state.markers.length; i < len; i++) {
            if (address == thismap.state.markers[i].address) {
                markerFound = true;
                break;
            }
        }
        if (markerFound !== true) {
            thismap.state.markers.push(obj);
        }

        marker.InfoWindow = new google.maps.InfoWindow();

        //KEP TODO Use this...
        google.maps.event.addListener(marker, 'click', function () {
            marker.InfoWindow.setContent( thismap.infoTemplate(obj) );
            marker.InfoWindow.setPosition(marker.getPosition());
            marker.InfoWindow.open(thismap.instance);
        });

        thismap.save();
    },

    getDirections: function(start, end) {
        var thismap = this,
            request = {
                origin:start,
                destination:end,
                travelMode: google.maps.TravelMode.DRIVING
            };

        thismap.directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {

                thismap.directionsDisplay.setMap(thismap.instance);
                thismap.directionsDisplay.setDirections(response);

                thismap.directionResponse = response;
                
                $.publish('navigate', [start, end]);
            }
        });
    },

    clear: function() {
        var thismap = this;
        thismap.clearMarkers().clearDirections();
    },

    clearMarkers: function() {
        var thismap = this;
        for (var i = 0, len = thismap.markers.length; i < len; i++) {
            var marker = thismap.markers[i];
            marker.setMap(null);
        }

        thismap.markers = thismap.state.markers = [];

        return thismap;
    },

    clearDirections: function() {
        var thismap = this;
        thismap.directionsDisplay.setMap(null);
        thismap.addresses = thismap.state.addresses = [];

        return thismap;
    },

    toggleMapPrintView: function() {
        var thismap = this;
        if(thismap.isPrinting === false) {
            var steps = thismap.directionResponse.routes[0].legs[0];

            $(thismap.el).css('display', 'none');
            $(thismap.directionsEl).css('display', 'block').html( thismap.directionTemplate(steps) );

            // call browser's print method
            window.print();
        }
        else {
            $(thismap.el).css('display', '');
            $(thismap.directionsEl).css('display', 'none').empty();
        }

        thismap.isPrinting = !thismap.isPrinting;
    },

    save: function () {}

};


$(document).ready(function() {

    // initialize map
    Map.initialize( document.getElementById('map'), document.getElementById('directions') );

});
