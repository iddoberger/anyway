var INACCURATE_MARKER_OPACITY = 0.5;

var MarkerView = Backbone.View.extend({
    events : {
        "click .delete-button" : "clickDelete"
    },
    initialize : function(options) {
        this.map = options.map;
        _.bindAll(this, "clickMarker");
    },
    render : function() {
        var markerPosition = new google.maps.LatLng(this.model.get("latitude"), this.model.get("longitude"));

        this.marker = new google.maps.Marker({
            position: markerPosition,
            id: this.model.get("id")
        });

        if (this.model.get("type") == MARKER_TYPE_DISCUSSION) {
            this.marker.setIcon(DISCUSSION_ICON);
            this.marker.setTitle("דיון"); //this.model.get("title"));
            this.marker.setMap(this.map);
            this.marker.view = this;
            google.maps.event.addListener(this.marker, "click", _.bind(app.showDiscussion, app, this.marker) );
            return this;
        }
      
        app.clusterer.addMarker(this.marker);
        if (app.map.zoom < MINIMAL_ZOOM) {
            return this;
        }

        this.marker.setOpacity(this.model.get("locationAccuracy") == 1 ? 1.0 : INACCURATE_MARKER_OPACITY);
        this.marker.setIcon(this.getIcon());
        this.marker.setTitle(this.getTitle());
        this.marker.setMap(this.map);
        this.marker.view = this;

        app.oms.addMarker(this.marker);

        this.$el.html($("#marker-content-template").html());

        this.$el.width(400);
        this.$el.find(".title").text(SUBTYPE_STRING[this.model.get("subtype")]);
        this.$el.find(".description").text(this.model.get("description"));
        this.$el.find(".creation-date").text("תאריך: " +
                    moment(this.model.get("created")).format("LLLL"));
        this.$el.find(".profile-image").attr("src", "/static/img/lamas.png");
        this.$el.find(".profile-image").attr("width", "50px");
        display_user = 'הלשכה המרכזית לסטטיסטיקה';
        this.$el.find(".added-by").text("מקור: " + display_user);

        return this;
    },
    getIcon : function() {
        return getIcon(this.model.get("subtype"), this.model.get("severity"));
    },
    getTitle : function() {
        return moment(this.model.get("created")).format("l") +
            " תאונה " + SEVERITY_MAP[this.model.get("severity")] +
            ": " + SUBTYPE_STRING[this.model.get("subtype")];
    },
    choose : function() {
        if (app.oms.markersNearMarker(this.marker).length) {
            new google.maps.event.trigger(this.marker, "click");
        }
        new google.maps.event.trigger(this.marker, "click");
    },
    getUrl: function () {
        var dateRange = app.model.get("dateRange");
        var center = app.map.getCenter();
        return "/?marker=" + this.model.get("id") + "&" + app.getCurrentUrlParams();
    },
    clickMarker : function() {
        this.highlight();
        app.closeInfoWindow();

        app.selectedMarker = this;
        app.infoWindow = new google.maps.InfoWindow({
            content: this.el
        });

        app.infoWindow.open(this.map, this.marker);
        app.updateUrl(this.getUrl());

        google.maps.event.addListener(app.infoWindow,"closeclick",function(){
            app.fetchMarkers();
        });

        $(document).keydown(app.ESCinfoWindow);

    },
    highlight : function() {
    	if (app.oms.markersNearMarker(this.marker, true)[0]  && !this.model.get("currentlySpiderfied")){
            this.resetOpacitySeverity();
    	}
        this.marker.setAnimation(google.maps.Animation.BOUNCE);


        // ##############################
        // # Another option, if we don't want the somewhat unintuitive experience where an icon start's bouncing,
        // # but other icons in the same place stay still, will be to do like so: (option 2)
        // ##############################

        // _.each(app.oms.markersNearMarker(this.marker), function (marker){

        //     marker.setAnimation(google.maps.Animation.BOUNCE);

        // });
        // this.marker.setAnimation(google.maps.Animation.BOUNCE);

        // ## END (option 2)

    },
    unhighlight : function() {
    	if (app.oms.markersNearMarker(this.marker, true)[0] && !this.model.get("currentlySpiderfied")){
            this.opacitySeverityForGroup();
    	}
        this.marker.setAnimation(null);


        // ##############################
        // # Option 2
        // ##############################

        // _.each(app.oms.markersNearMarker(this.marker), function (marker){

        //     marker.setAnimation(null);

        // });
        // this.marker.setAnimation(null);

        // ## END (option 2)

    },
	clickShare : function() {
		FB.ui({
			method: "feed",
			name: this.model.get("title"),
			link: document.location.href,
			description: this.model.get("description"),
			caption: SUBTYPE_STRING[this.model.get("subtype")]
			// picture
		});
	},
    resetOpacitySeverity : function() {
        this.marker.icon = this.getIcon();
        this.marker.opacity = this.model.get("locationAccuracy") == 1 ? 1.0 : INACCURATE_MARKER_OPACITY;
    },
    opacitySeverityForGroup : function() {
        var group = this.model.get("groupID") -1;
        this.marker.icon = MULTIPLE_ICONS[app.groupsData[group].severity];
        if (app.groupsData[group].opacity != 'opaque'){
            this.marker.opacity = INACCURATE_MARKER_OPACITY / app.groupsData[group].opacity;
        }
    }
});
