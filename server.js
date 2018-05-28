let WebSocketServer = require('ws').Server
let http = require('http')
let express = require('express')
let schedule = require('node-schedule')
let app = express()
let MongoClient = require('mongodb').MongoClient
let assert = require('assert')
let port = process.env.PORT || 5001




//configure http server
app.use(express.static(__dirname + "/"))

let server = http.createServer(app)
server.listen(port)
console.log("http server listening on %d", port)






//this will probably end up being the main function
//on setting the alarm, it must store some kind of id so the user can cancel it later
function scheduleAlarm(date, user1, user2){
  //create 'room' with both users and commit to db
  //also send room information to clients?
  //maybe have to store room for each key (username)


  const alarmName = schedule.scheduleJob(date, ()=>{
    //send signal to raspberry pi
    //initiate some sort of game mode (send game information to client on connection)
    //wait for next message from client, maybe store instructions for each client in DB


  })

  return alarmName

}





// Connect to the db -- potentially move entire db into ws.on('message')
MongoClient.connect("mongodb://andrew:sevens7@ds235840.mlab.com:35840/heroku_rbffwg9m", function (err, db) {

    dbo = db.db('heroku_rbffwg9m')
    // let test = {hey: 'bro', its: 'me'}
    // dbo.collection("collection").insertOne(test, function(err, res) {
    if (err) throw err;
    db.close();
  // });

});

function handleUser(user_id){
  if(user_id === 'no_user'){
    let uniqueID = `${new Date}${Math.random()*10000000}`
    ws.send()
    console.log(uniqueID)
  }
}




//configure websocket server
let wss = new WebSocketServer({server: server})
console.log("websocket server created")

let user = 'no_user'

wss.on("connection", function(ws) {

  ws.on('message', function incoming(message) {
    const messageBody = JSON.parse(message).message
    const messageType = Object.keys(messageBody)[0]

    console.log('incoming message type:', messageType)

    switch(messageType){
      case 'user':
        user = JSON.parse(message).message['user']
        break;
      case 'setAlarm':
        console.log(JSON.parse(message).message['setAlarm'])
        schedule.scheduleJob(JSON.parse(message).message['setAlarm'], ()=>{
          console.log('this is a test alarm')
        })
        break;
      case 'deleteAlarm':
        console.log(JSON.parse(message).message['deleteAlarm'])
        break;
      case 'gameState':
        console.log(JSON.parse(message).message['gameState'])
        break;
      default:
        break;
    }

    //check id
      //does user have stored id? if not generate, store, and send
      //or if server cannot locate the id, generate new id, store, and send
      //or it it is valid, check the instructions


    //if alarm message...
      //const alarm = 0
      //find another user with alarm - if none exists, store the alarm and wait
      //if you find another user with the same alarm, schedule new alarm
      //let newAlarm = scheduleAlarm(alarm, user)
      //save newAlarm to db AND send back to user, like so...
      //save
      //ws.send(newAlarm)

    //if alarm cancel...
      //set alarm id to variable
      //cancel alarm

  })


  ws.send('you got it bitch')

  console.log("websocket connection open")

})
