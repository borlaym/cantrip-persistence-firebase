var fs = require("fs");
var _ = require("lodash");
var request = require("request");
var firebaseUrl = null;
var dataStore = null;

function addType(obj) {
	if (_.isObject(obj)) {
		//Array
		if (_.isArray(obj)) {
			//Recursive
			for (var i = 0; i < obj.length; i++) {
				addType(obj[i]);
			}
			//Add type
			obj._type = "array";
			//Convert to object
			obj = _.extend({}, obj);
		} else {
			//Object
			//Recursive
			for (var key in obj) {
				obj[key] = addType(obj[key]);
			}
			//Add type
			obj._type = "object";
		}

	} else {
		//Basic value, do nothing
	}
	return obj;
}

function cleanResponse(obj) {
	if (obj._type === "array") {
		delete obj._type;
		for (var key in obj) {
			cleanResponse(obj[key]);
		}
	} else if (obj._type === "object") {
		delete obj._type;
		for (var key in obj) {
			cleanResponse(obj[key]);
		}
	}
}


module.exports = {
	setupPersistence: function(callback) {
		firebaseUrl = this.options.namespace;
		dataStore = this.dataStore;
		callback();

	},
	syncData: function() {},
	get: function(req, res, next) {
		if (_.isObject(req.targetNode) || _.isArray(req.targetNode)) {
			dataStore.get(req.path, function(err, data) {
				res.body = data;
				next();
			});
		} else {
			res.body = {
				value: req.targetNode
			};
			next();
		}
	},
	targetNode: function(req, res, next) {
		//Set _contents as the base path if there is no _meta route specified
		if (req.path[1] !== "_") {
			var current = req.path;
			//Redefine getter
			Object.defineProperty(req, 'path', {
			    get: function() {
			        return "/_contents" + current;
			    }
			});
		}
		//You can access the actual root if you specify the route /_meta
		else if (req.path.indexOf("/_meta") === 0) {
			var current = req.path;
			//Redefine getter
			Object.defineProperty(req, 'path', {
			    get: function() {
			        return current.replace("_meta", "");
			    }
			});
		}
		request({
			method: "GET",
			url: firebaseUrl + req.path + "/_type.json",
			json: true
		}, function(error, response, body) {
			if (error) {
				return next(error);
			}
			if (body === "object") req.targetNode = {};
			else if (body === "array") req.targetNode = [];
			next();
		});
	},
	dataStore: {
		get: function(path, callback) {
			request({
				method: "GET",
				url: firebaseUrl + path + ".json",
				json: true
			}, function(error, response, body) {
				cleanResponse(body);
				callback(error, body);
			});
		},
		set: function(path, data, callback) {
			//add _type attributes to every node
			addType(data);
			//get the type of object we want to set something on
			request({
				method: "GET",
				url: firebaseUrl + path + "/_type.json",
				json: data
			}, function(error, response, body) {
				if (body === "object") {
					request({
						method: "PATCH",
						url: firebaseUrl + path + ".json",
						json: data
					}, function(error, response, body) {
						callback(error, body);
					});
				} else if (body === "array") {
					request({
						method: "POST",
						url: firebaseUrl + path + ".json",
						json: data
					}, function(error, response, body) {
						callback(error, body);
					});
				} else {
					callback({"error": "POSTING IN A BASIC VALUE"})
				}
			});
			
		},
		delete: function(path, callback) {
			request({
				method: "DELETE",
				url: firebaseUrl + path + ".json",
				json: data
			}, function(error, response, body) {
				callback(error, body);
			});
		},
		parent: function(path, callback) {
			request({
				method: "GET",
				url: firebaseUrl + (path.split("/").splice(0, path.split("/").length -1).join("/")) + ".json",
				json: data
			}, function(error, response, body) {
				callback(error, body);
			});
		}
	}
}