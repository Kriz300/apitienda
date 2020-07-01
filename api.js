var express = require("express");
var session = require('express-session');
var cookieParser = require('cookie-parser');
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

app.use(cookieParser());

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

app.get("/", function(req, res) {
	res.send(req.session["carrito"]);
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

app.get("/agregarCarro/:prod&:cant", async function(req, res) {
	if (parseInt(req.params.cant)>0) {
		var flag = 0;
		var product = req.params.prod;
		if (req.session["carrito"]) {
			for (var i in req.session["carrito"]) {
				if (i==product) {
					req.session["carrito"][i] = req.session["carrito"][i]+parseInt(req.params.cant);
					flag = 1;
				}
			}
			if (flag===1) {
				res.send("Producto Añadido Correctamente");
			}
			else{
				req.session["carrito"][product] = parseInt(req.params.cant);
				res.send("Producto Añadido Correctamente");
			}
		}
		else {
			req.session["carrito"] = {};
			req.session["carrito"][product] = parseInt(req.params.cant);
			res.send("Producto Añadido Correctamente");
		}
	}
	else {
		res.send("Cantidad Invalida");
	}
});

app.get("/delCarro/:prod", async function(req, res) {
	var flag = 0;
	var rm;
	var product = req.params.prod;
	if (req.session["carrito"]) {
		for (var i in req.session["carrito"]) {
			if (i==product) {
				rm = i;
				flag = 1;
			}
		}
		if (flag===1) {
			delete req.session["carrito"][rm];
			res.send("Producto Borrado :c");
		}
		else{
			res.send("Producto no encontrado");
		}
	}
	else {
		res.send("Carro Vacio :'c");
	}
});

app.get("/compraCarro", async function(req, res) {
	if (req.session["carrito"]) {
		if ((Object.keys(req.session["carrito"]).length)>0) {
			var product;
			var cont = 0;
			var compra = {};
			compra["comprador"] = req.sessionID; //a falta de login el comprador es la cookie
			var lista = "";
			for (var i in req.session["carrito"]) {
				if (lista != "") lista+=",";
				product = await prod.findOne({_id:new ObjectID(i)});
				lista += i+","+req.session["carrito"][i].toString();
				cont += parseInt(product["pre"])*req.session["carrito"][i];
			}
			compra["listaVenta"] = lista;
			compra["monto-total"] = cont.toString();
			compra["fecha"] = null;
			compras.insertOne(compra, function(err, res) {
				if (err) throw err;
			});
			req.session["carrito"] = {};
			res.send("Compra Realizada");
		}
		else {
			res.send("Carro Vacio :'c");
		}
	}
	else {
		res.send("Carro Vacio :'c");
	}
	
});

app.get("/ordenesdeCompra", function(req, res) {
	compras.find({}).toArray( async function(err, result) {
		if (err) throw err;
		var arr = [];
		var cont = 0;
		var carrito = {};
		var prods, comprador, lista, orden;//, response;
		for (var i in result) {
			orden = {};
			lista = result[i]["listaVenta"].split(",");
			cont = 0;
			carrito = {};
			//response = await user.findOne({_id:new ObjectID(result[i]["comprador"])});
			//comprador = response["name"];
			comprador = result[i]["comprador"];
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
		var lista = result["listaVenta"].split(",");
		try {
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
		}
		catch (err) {
			comprador = result["comprador"];
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
		}
	});
});

app.listen(3000, function() {
	console.log("Listen on port 3000!!!");
});