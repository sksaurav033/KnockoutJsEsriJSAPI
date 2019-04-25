var globals = {};

require([
  "dojo/_base/connect",
  "dojo/_base/array",
  "dojo/_base/Color",
  "dojo/dom",
  "dojo/has",
  "dojo/parser",
  "dojo/dom-style",
  "esri/dijit/Search",
  "esri/map",
  "dojo/on",
  "esri/geometry/Point",
  "esri/geometry/webMercatorUtils",
  "esri/domUtils",
  "esri/request",

  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/renderers/UniqueValueRenderer",
  "esri/graphic",
  "esri/InfoTemplate",
  "esri/layers/GraphicsLayer",

  "dijit/layout/BorderContainer",
  "dijit/layout/ContentPane"
], function (
connect, array, color, dom, has, parser, domStyle, Search, Map, on, Point, webMercatorUtils, domUtils, esriRequest, sms, sls, UniqueValueRenderer, Graphic, InfoTemplate, GraphicsLayer) {
    // define() needs to be defined before loading ko
    require(["js/lib/knockout-2.2.1.js", "dojo/domReady!"], function (ko) {
        // Here's my data model
        var ViewModel = function () {
            var _self = this;

            this.photoList = ko.observable();
            this.pics = ko.observableArray([]);
            this.showMoreVisible = ko.observable(false);

            this.show_more = function () {
                globals.currentPicIndex += 3;
                globals.currentPicCount += 3;
                _self.showPhotos(globals.currentPics.slice(globals.currentPicIndex, globals.currentPicCount));
            };

            this.showPhotos = function (pics) {
                //console.log("show photos: ", globals.currentPicIndex, pics);
                _self.showMoreVisible(true);
                for (var i = 0; i < pics.length; i++) {
                    _self.pics.push(pics[i]);
                }
                _self.photoList("Found " + globals.currentPics.length + " photos searching for " + globals.currentSearch + ". Showing " + globals.currentPicCount + ".<br><br>");
                if (globals.currentPicIndex + 3 < globals.currentPics.length) {
                    _self.showMoreVisible(true);
                } else {
                    _self.showMoreVisible(false);
                }
            };

            this.flickrResults = function (response) {
                //console.log("flickr stuff! ", response);
                globals.currentPics = response.photos.photo; // array of objects with photo info
                if (globals.currentPics.length > 0) {
                    globals.currentPicIndex = 0;
                    globals.currentPicCount = 3;
                    _self.showMoreVisible(true);
                    _self.showPhotos(globals.currentPics.slice(globals.currentPicIndex, globals.currentPicCount));
                } else {
                    _self.showMoreVisible(false);
                    _self.photoList("Didn\'t find any photos searching for " + globals.currentSearch + ". Please click another point.");
                }
            };

            this.searchFlickr = function (evt) {
                globals.currentSearch = evt.value.split(",")[0];
                _self.pics([]);
                _self.photoList("Searching flickr for " + evt.value.split(",")[0] + " photos.");
                esriRequest({
                    url: "https://api.flickr.com/services/rest/",
                    content: {
                        method: "flickr.photos.search",
                        api_key: "3fb6f3bed34f310b5d80e6c3fdca1865",
                        tags: evt.value.split(",")[0],
                        text: evt.value.split(",")[0],
                        per_page: "30",
                        format: "json"
                    },
                    callbackParamName: "jsoncallback"
                }).then(_self.flickrResults, _self.errorHandler);
            };

            this.errorHandler = function (error) {
                console.log("error: ", error);
            };

            this.init = function () {
                _self.photoList("Search for a place to load photos of location from Flickr.");
                // prevent flash of unstyled content(FOUC)
                domStyle.set(dom.byId("main-window"), "visibility", "visible");
                globals.map = new Map("map", {
                    basemap: "streets",
                    center: [90.54, 22.85],
                    zoom: 5,
                    logo: true,
                    showAttribution: false
                });
                // search widget
                globals.search = new Search({
                    map: globals.map,
                    enableSuggestions: true
                }, "search");
                globals.search.startup();
                on(globals.search, 'search-results', function (e) {
                    _self.searchFlickr(e);
                });
            };

            this.basemapClick = function (data, e) {
                // only set the basemap if something different was clicked
                if (e.target.id !== globals.map.getBasemap()) {
                    globals.map.setBasemap(e.target.id);
                }
            };

            this.init();
        };
        ko.applyBindings(new ViewModel()); // This makes Knockout get to work
    });
});