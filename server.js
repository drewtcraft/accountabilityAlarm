let WebSocketServer = require('ws').Server
let http = require('http')
let express = require('express')
let schedule = require('node-schedule')
let app = express()
let MongoClient = require('mongodb').MongoClient
let port = process.env.PORT || 5001

app.use(express.static(__dirname + "/"))

let server = http.createServer(app)
server.listen(port)


function scheduleAlarm(){
  
}

// Connect to the db -- potentially move entire db into ws.on('message')
MongoClient.connect("mongodb://andrew:sevens7@ds235840.mlab.com:35840/heroku_rbffwg9m", function (err, db) {

    dbo = db.db('heroku_rbffwg9m')
    let test = {hey: 'bro', its: 'me'}
    dbo.collection("collection").insertOne(test, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");
    db.close();
  });

});

console.log("http server listening on %d", port)

let wss = new WebSocketServer({server: server})
console.log("websocket server created")

wss.on("connection", function(ws) {

  ws.send('you got it bitch')

  console.log("websocket connection open")


  ws.on("close", function() {
    console.log("websocket connection close")
    clearInterval(id)
  })
})
