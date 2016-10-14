if(OWF.Util.isRunningInOWF()) {

    // -----------------------------------
    // Add behaviour if widget is in OWF
    // -----------------------------------
    Map.save = function () {
        OWF.Preferences.setUserPreference({
            namespace: OWF.getInstanceId(),
            name: 'widgetstate',
            value: OWF.Util.toString( this.state ),
            onSuccess: function () {
                //console.log(arguments) 
            },
            onFailure: function () {}
        });
    };

    Map.setPrintEnabled = function (enabled) {
        OWF.Chrome.updateHeaderButtons({
            items: [{
                itemId:'print',
                type: 'print',
                disabled: !enabled
            }]
        }); 
    };




    // -----------------------------------
    // Initialize
    // -----------------------------------

    OWF.ready(function () {


        // -----------------------------------
        // Retrieve saved state
        // -----------------------------------

        OWF.Preferences.getUserPreference({
            namespace: OWF.getInstanceId(),
            name: 'widgetstate',
            onSuccess: function (response) {
                if(response.value) {
                    console.log('KEP calling setState with', OWF.Util.parseJson(response.value).markers.length, 'markers');
                    Map.setState( OWF.Util.parseJson(response.value) );
                } else {

                    // -----------------------------------
                    // Check for launch data ONLY IF state didn't already exist
                    // -----------------------------------

                    var launchData = OWF.Launcher.getLaunchData();
                    if(launchData && launchData.address) { Map.placeMarker(launchData); }
                }
            }
        });



        // -----------------------------------
        // Subscribe to channels
        // -----------------------------------

        OWF.Eventing.subscribe('org.owfgoss.owf.examples.GoogleMapsExample.plotAddress', function (sender, msg, channel) {
            Map.placeMarker(msg);
        });

        OWF.Eventing.subscribe('org.owfgoss.owf.examples.GoogleMapsExample.removeAddress', function (sender, msg, channel) {
            Map.clearMarker(msg);
        });



        // -----------------------------------
        // Setup receive intents
        // -----------------------------------


        // Registering for plot intent, and place marker when intent is received.
        OWF.Intents.receive({
            action: 'plot',
            dataType: 'application/vnd.owf.sample.address'
        },function (sender, intent, msg) {

            Map.placeMarker(msg);

        });


        // Registering for navigate intent, and getting directions when intent is received.
        OWF.Intents.receive({
            action: 'navigate',
            dataType: 'application/vnd.owf.sample.addresses'
        },function (sender, intent, msg) {

            Map.getDirections(msg[0], msg[1]);

        });

 
        // Registering for clear markers intent
        OWF.Intents.receive({
            action: 'clear',
            dataType: ''
        },function (sender, intent, msg) {
            Map.clearMarkers();
        });



        // -----------------------------------
        // Add print button to widget chrome
        // -----------------------------------

        OWF.Chrome.insertHeaderButtons({
            items: [
                {
                    xtype: 'widgettool',
                    type: 'print',
                    itemId:'print',
                    tooltip:  {
                      text: 'Print Directions!'
                    },
                    handler: function(sender, data) {
                        Map.toggleMapPrintView();
                    }
                }
            ]
        });




        // -----------------------------------
        // Toggle chrome button state 
        // -----------------------------------

        $.subscribe('marker:pan', function () {
            //console.log('disabling print button', OWF.getInstanceId());
            Map.setPrintEnabled(false);
        });

        $.subscribe('navigate', function() {
            //console.log('enabling print button', OWF.getInstanceId());
            Map.setPrintEnabled(true);
        });



        // -----------------------------------
        // Clean up when widget closes
        // -----------------------------------

        var widgetState = Ozone.state.WidgetState.getInstance({
            onStateEventReceived: function(sender, msg) {
                var event = msg.eventName;

                if(event === 'beforeclose') {

                    widgetState.removeStateEventOverrides({
                        event: [event],
                        callback: function() {

                            OWF.Preferences.deleteUserPreference({
                                namespace: OWF.getInstanceId(),
                                name: 'widgetstate',
                                onSuccess: function (response) {
                                    widgetState.closeWidget();
                                }
                            });

                        }
                    });

                }
                else if(event === 'activate' || event === 'show') {
                    Map.el.style.display = 'block';
                }
                else if(event === 'hide') {
                    Map.el.style.display = 'none';
                }
            }
        });

        // override beforeclose event so that we can clean up
        // widget state data
        widgetState.addStateEventOverrides({
            events: ['beforeclose']
        });

        // listen for  activate and hide events so that we can
        // hide map object to fix a bug in Google Maps
        widgetState.addStateEventListeners({
            events: ['activate', 'hide', 'show']
        });
        
        OWF.notifyWidgetReady();

    });
}

