var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

app.use(express.static(__dirname + "/"))

var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)

var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI || "mongodb://drewtcraft:Iam#18now@ds235840.mlab.com:35840/heroku_rbffwg9m", function (err, client) {
  if (err) {
    console.log('fuckshitlskjdflwkad', err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = client.db();
  console.log("Database connection ready");

var wss = new WebSocketServer({server: server})
console.log("websocket server created")

wss.on("connection", function(ws) {


  console.log("websocket connection open")

  ws.on("close", function() {
    console.log("websocket connection close")
    clearInterval(id)
  })
})
