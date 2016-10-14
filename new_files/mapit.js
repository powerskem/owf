// -----------------------------------
// Map It Feature for the eWidget
//
// Kathleen Powers
//
//
// Widget Intents API requires:
// <link rel="stylesheet" href="../owf/css/dragAndDrop.css">
// <script src="../../../owf/js-min/owf-widget-debug.js"></script>
// <script src="https://code.jquery.com/jquery-1.9.1.min.js"></script>
//
// -----------------------------------
OWF.relayFile = '/owf/js/eventing/rpc_relay.uncompressed.html';

$(document).ready(function() {

    function startsWith(str, prefix) {
    	if (str.length < prefix.length)
            return false;
        for (var i = prefix.length - 1; (i >= 0) && (str[i] === prefix[i]); --i)
            continue;
        return i < 0;
    }

    function getLatLonAddressFrom(buttonClickObject,document) {
        var rownum = "row",
            lat_id = "lat",
            lon_id = "lon";

        // Get the rownum from the element id that was clicked
        rownum = buttonClickObject.id.slice(3);

        // Create each expected id to getElementById
        lat_id = lat_id.concat(rownum);
        lon_id = lon_id.concat(rownum);

        var lat = document.getElementById(lat_id).innerHTML,
            lon = document.getElementById(lon_id).innerHTML;

        // Shorten the lat/lons to 13 chars
        lat = lat.slice(0,13);
        lon = lon.slice(0,13);

        return lat.concat(",",lon);
    }

    OWF.ready(function() {
        $("button").on('click', function(e) {
          e.preventDefault();

          if (startsWith(this.id,"map")) {
            var targetAddress = getLatLonAddressFrom(this,document); //KEP This is a blocking call
            var data = 
                {
                    address:    targetAddress
                    //accessLevel: 7 // Refers to filtering to certain listeners
                };

            OWF.getOpenedWidgets(function(widgetList) {
              var mapCount = 0;
              var mapWidgetIds = [];
              var mapWidgets = [{}];

              if (widgetList != null) {

                // Loop through the open widgets
                widgetList.forEach(function(element, index, array) { //KEP This is a blocking call
                    if (element.widgetName == "Google Maps") {
                        mapWidgetIds[mapCount++] = element.id;
                    }
                }); //widgetList.forEach

                if (mapWidgetIds.length > 0) { // At least one map is already open
                  mapWidgetIds.forEach(function(element, index, array) {
                    OWF.Eventing.publish('org.owfgoss.owf.examples.GoogleMapsExample.plotAddress', data, '{"id":"' + element + '"}');
                  });
                } else { // No open maps yet... 
                    OWF.Launcher.launch({
                        universalName: 'org.owfgoss.owf.examples.GoogleMaps',
                        launchOnlyIfClosed: true,
                        pane: 'sibling',
                        data: data
                        }, function (result) {
                        OWF.Eventing.publish('org.owfgoss.owf.examples.GoogleMapsExample.plotAddress', data, '{"id":"' + result.uniqueId + '"}');
                    });
                } //if (mapWidgetIds.length > 0)

              } //if (widgetList != null)
            }); //OWF.getOpenedWidgets

          } //if (this.id.startsWith("map"))
          else if (startsWith(this.id,"clr")) {

            var targetAddress = getLatLonAddressFrom(this,document); //KEP This is a blocking call
            var data = 
                {
                    address: targetAddress
                };


              OWF.getOpenedWidgets(function(widgetList) {
                  var mapCount = 0;
                  var mapWidgetIds = [];
                  var mapWidgets = [{}];

                  if (widgetList != null) {

                      // Loop through the open widgets
                      widgetList.forEach(function(element, index, array) { //KEP This is a blocking call
                          if (element.widgetName == "Google Maps") { // universalName: 'org.owfgoss.owf.examples.GoogleMaps',
                              mapWidgetIds[mapCount++] = element.id;
                          }
                      }); //widgetList.forEach

                      if (mapWidgetIds.length > 0) { // At least one map is open
                          mapWidgetIds.forEach(function(element, index, array) {
                              // Use the Eventing API
                              OWF.Eventing.publish('org.owfgoss.owf.examples.GoogleMapsExample.removeAddress', data, '{"id":"' + element + '"}');
                          });
                      }
                  }
              });

          } //else if (this.id.startsWith("clr"))
          else if (startsWith(this.id,"msg")) {
              var rec_id = "rid";
              var rownum = this.id.slice(3);

              rec_id = rec_id.concat(rownum);
              var msg = document.getElementById(rec_id).innerHTML;

              var data = { message: msg };
              OWF.Eventing.publish('aWidgetChannel', data);
          }
        }); //$("button")
    }); //OWF.ready
}); //$(document).ready



