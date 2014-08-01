var Cantrip = require("Cantrip");
var firebase = require("./index.js");

Cantrip.options.persistence = firebase;
Cantrip.options.port = 3000;
Cantrip.options.namespace = "https://crackling-fire-132.firebaseio.com";

Cantrip.start();