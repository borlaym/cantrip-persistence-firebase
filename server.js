var Cantrip = require("Cantrip");
var firebase = require("./index.js");
var request = require("request");

Cantrip.options.persistence = firebase;
Cantrip.options.port = 3000;

Cantrip.start(function() {
	
});