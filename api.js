var express = require("express");
var app = express();
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var dbo,cat,prod;
var ObjectID = mongo.ObjectID;

MongoClient.connect(url, function(err, db) {
	if (err) throw err;
	dbo = db.db("tienda");
	cat = dbo.collection("categorias");
	prod = dbo.collection("productos");
});

app.get("/categorias", function(req, res) {
	cat.find({}).toArray(function(err, result) {
		if (err) throw err;
		var arr = {};
		for (var i in result) arr[result[i]["_id"]] = result[i]["name"];
		res.send(arr);
	});
});

app.get("/productosCat/:cat", function(req, res) {
	prod.find({categoria:req.params.cat}).toArray(function(err, result) {
		if (err) throw err;
		var arr = {};
		for (var i in result) arr[result[i]["_id"]] = result[i]["name"];
		res.send(arr);
	});
});

app.get("/producto/:prod", function(req, res) {
	prod.findOne({_id:new ObjectID(req.params.prod)}, function(err, result) {
		if (err) throw err;
		var arr = {};
		arr["id"] = result["_id"];
		arr["name"] = result["name"];
		arr["desc"] = result["desc"];
		arr["pre"] = result["pre"];
		res.send(arr);
	});
});

app.get("/agregarCarro/:prod&:cant", function(req, res) {
	res.send("Hello World!");
});

app.get("/delCarro/:prod", function(req, res) {
	res.send("Hello World!");
});

app.get("/compraCarro", function(req, res) {
	res.send("Hello World!");
});

app.get("/ordenesdeCompra", function(req, res) {
	res.send("Hello World!");
});

app.get("/orden/:id", function(req, res) {
	res.send("Hello World!");
});

app.listen(3000, function() {
	console.log("Listen on port 3000!!!");
});