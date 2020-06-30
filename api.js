var express = require("express");
var app = express();
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var dbo,cat,prod,compras,user;
var ObjectID = mongo.ObjectID;

MongoClient.connect(url, function(err, db) {
	if (err) throw err;
	dbo = db.db("tienda");
	cat = dbo.collection("categorias");
	prod = dbo.collection("productos");
	compras = dbo.collection("compras");
	user = dbo.collection("usuarios");
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
	prod.findOne({_id:new ObjectID(req.params.prod)}, function(err, result) {
		if (err) throw err;
		product = {"id":result["_id"], "name":result["name"], "pre":result["pre"], "cant":parseInt(req.params.cant)};
		addtoCart(product);
	res.send(product);
	});
});

app.get("/delCarro/:prod", function(req, res) {
	if(del(req.params.prod)==0) {
		res.send("Producto eliminado :c");
	}
	res.send("Producto no encontrado en el carrito");
});

app.get("/compraCarro", function(req, res) {
	res.send(JSON.parse(localStorage.getItem("shoppingCart")));
});

app.get("/ordenesdeCompra", function(req, res) {
	compras.find({}).toArray( async function(err, result) {
		if (err) throw err;
		var arr = [];
		var cont = 0;
		var carrito = {};
		var prods, comprador, response, lista, orden;
		for (var i in result) {
			orden = {}
			lista = result[i]["listaVenta"].split(",")
			cont = 0;
			carrito = {};
			response = await user.findOne({_id:new ObjectID(result[i]["comprador"])});
			comprador = response["name"];
			for (let x = 0; x < lista.length; x+=2) {
				prods = {};
				response = await prod.findOne({_id:new ObjectID(lista[x])});
				prods["name"] = response["name"];
				prods["pre"] = response["pre"];
				carrito[cont] = prods;
				cont++;
			}
			orden[comprador] = carrito;
			arr.push(orden);
		}
		res.send(arr);
	});
});

app.get("/orden/:id", function(req, res) {
	compras.findOne({_id:new ObjectID(req.params.id)}, async function(err, result) {
		if (err) throw err;
		var cont = 0;
		var carrito = {};
		var prods, comprador, response;
		var orden = {}
		var lista = result["listaVenta"].split(",")
		response = await user.findOne({_id:new ObjectID(result["comprador"])});
		comprador = response["name"];
		for (let x = 0; x < lista.length; x+=2) {
			prods = {};
			response = await prod.findOne({_id:new ObjectID(lista[x])});
			prods["name"] = response["name"];
			prods["pre"] = response["pre"];
			prods["cant"] = lista[x+1];
			carrito[cont] = prods;
			cont++;
		}
		orden[comprador] = carrito;
		res.send(orden);
	});
});

app.listen(3000, function() {
	console.log("Listen on port 3000!!!");
});