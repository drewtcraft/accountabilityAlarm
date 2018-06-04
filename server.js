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
console.log("http server listening on", port)

//connect to mongodb -- todo: handle lost connection
var mdb
MongoClient.connect("mongodb://andrew:sevens7@ds235840.mlab.com:35840/heroku_rbffwg9m",
  function (err, db) {
    mdb = db.db('heroku_rbffwg9m')
    if (err) throw err;
});

function appendUniqueNumber(arr, max){
  let originalLength = arr.length
  while(originalLength === arr.length){
    let num = Math.floor(Math.random() * max)
    if(arr.indexOf(num) === -1)
    {arr.push(num)}
  }
  return arr
}

function createSinglePlayerGameState(date, user){
  let gameState = {}
  gameState['type'] = 'single'
  gameState['user'] = user

  let threeRandos = []
  while(threeRandos.length < 3){
    threeRandos = appendUniqueNumber(threeRandos, 26)
  }

  gameState['solution'] = threeRandos
  gameState['state'] = []

  let obj = {}
  obj[`${date}${user}`] = gameState

  console.log('new single player game state created', obj)

  return obj
}

function createTwoPlayerGameState(date, user1, user2){
  let gameState = {}
  gameState['type'] = 'multi'
  gameState['users'] = []
  gameState['users'].push(user1)
  gameState['users'].push(user2)

  let threeRandos = []
  while(threeRandos.length < 3){
    threeRandos = appendUniqueNumber(threeRandos, 26)
  }

  gameState['solution'] = threeRandos
  gameState['state'] = []
  gameState['turn'] = user1

  let obj = {}
  obj[`${date}${user1}${user2}`] = gameState

  return obj
}


function checkForSolution(gameState){
  console.log('solutionnnnnn', gameState)
  let hits = 0
  gameState['solution'].forEach((num)=>{
    if(gameState['state'].indexOf(num) !== -1){
      hits++
    }
  })
  return hits === 3 ?  true :  false
}

function updateServerGameState(serverGameStates, gameState){
  serverGameStates[Object.keys(gameState)[0]] = gameState[Object.keys(gameState)[0]]
  return serverGameStates
}

function computerMove(gameState){
  console.log('entering computer move', gameState)
  console.log(gameState['state'])
  gameState['state'] = appendUniqueNumber(gameState['state'], 26)
  console.log('computer has moved', gameState
  )
  return gameState
}









let alarmsObj = {}

function scheduleSingleAlarm(date, user){
  const gameID = `${date}${user}`
  console.log('incoming date:', new Date(date))
  console.log('randodate:', new Date)


//set actual alarm
  alarmsObj[gameID] = schedule.scheduleJob(new Date(date), ()=>{
    console.log('singleplayermatch BEGUN')

    //send signal to raspberry pi

    const newGameState = createSinglePlayerGameState(date, user)

    //set active game
    onePlayerGames[gameID] = newGameState[gameID]

    mdb.collection('users').update({user: user},
      {$push:{games: {
        $each: [gameID],
        $sort: {score: 1}
      }}})

    //do I need to update the server's user games?
    //mdb.users.update({user: user1}, {'$push':{games: gameID}})
    console.log('single player alarm going off')
    if(user in clients){
      console.log('sending message via scheduled alarm')
      let returnObj = {}
      returnObj[`${gameID}`] = onePlayerGames[gameID]
      mdb.collection('users').find({user: user}).toArray((err, userObj)=>{
        if(userObj[0].games[0].indexOf(gameID) === -1){
          clients[user].send(JSON.stringify({'gameState1': returnObj}))
        }
      })

    }


  })

  return gameID

}

function scheduleCollabAlarm(date, user1, user2){

  const gameID = `${date}${user1}${user2}`

  //update both stored alarms to say 'matched: ${roomName}'
  mdb.collection('alarms').update({
    date: date,
    user: user1},
    {$set: {matched: gameID}})
  mdb.collection('alarms').update({
    date: date,
    user: user2},
    {$set: {matched: gameID}})

   alarmsObj[gameID]= schedule.scheduleJob(new Date(date), ()=>{

    //send signal to raspberry pi
    //clients['pi'].send('on')

    const newGameState = createTwoPlayerGameState(date, user1, user2)

    //set active game
    twoPlayerGames[gameID] = newGameState[gameID]

    mdb.collection('users').update({user: user1},
      {$push:{games: {
        $each: [gameID],
        $sort: {score: 1}
      }}})

      mdb.collection('users').update({user: user2},
        {$push:{games: {
          $each: [gameID],
          $sort: {score: 1}
        }}})

      for(user1 in clients){
        mdb.collection('users').find({user: user1}).toArray((err, userObj)=>{
          if(userObj[0].games[0].indexOf(gameID) === -1){
            clients[user1].send(JSON.stringify({'gameState2': returnObj}))
          }
        })
      }
      for(user2 in clients){
        mdb.collection('users').find({user: user2}).toArray((err, userObj)=>{
          if(userObj[0].games[0].indexOf(gameID) === -1){
            clients[user2].send(JSON.stringify({'gameState2': returnObj}))
          }
        })
      }


  })
  return gameID
}

//configure websocket server
let wss = new WebSocketServer({server: server})
console.log("websocket server created")

var clients = {}
var onePlayerGames = {}
var twoPlayerGames = {}

wss.on("connection", function(ws) {

  let user = 'no_user'

  //helper function for formatting messages
  function sendMessage(type, payload){
    let obj = {}
    obj[type] = payload
    ws.send(JSON.stringify(obj))
  }

  ws.on('message', function incoming(data) {

    const messageType = Object.keys(JSON.parse(data))[0]
    const message = JSON.parse(data)[messageType]

    console.log('incoming message type:', messageType)
    console.log('incoming message:', message)

    switch(messageType){
      case 'user':

        if(message === 'no_user'){
          let uniqueID = `${new Date}${Math.random()*10000000}`
          mdb.collection('users').insertOne({
            user: uniqueID,
            currentGame: null
          }, (err)=> console.log(err))
          sendMessage('new_id', uniqueID)
        } else {
          console.log('alleged user', message)
          user = message
          clients[user] = ws
          console.log('client added')
          //check database to see if user has an active game
          mdb.collection('users').find({'user': message}).toArray((err, userObj)=>{
              const currentGame = userObj[0].currentGame
              console.log('this is working', currentGame)
              if(onePlayerGames.hasOwnProperty(currentGame)){
                console.log(onePlayerGames[currentGame])
                let rObj = {}
                rObj[currentGame] = onePlayerGames[currentGame]
                sendMessage('gameState1', rObj)
              } else if (twoPlayerGames.hasOwnProperty(currentGame)){
                let rObj = {}
                rObj[currentGame] = onePlayerGames[currentGame]
                sendMessage('gameState2', rObj)
              }
          })
        }
        break;

      case 'setAlarm':
        let converted = new Date(message)
        //zero out seconds of incoming date
        let incomingAlarm = JSON.stringify(new Date(
          converted.getFullYear(),
          converted.getMonth(),
          converted.getDate(),
          converted.getHours(),
          converted.getMinutes(),
          0, 0))
        console.log('setting alarm', incomingAlarm)
        console.log('looking for match')
        //try to find a collaborator first...
        //check db for a matching alarm
        mdb.collection('alarms').find({
          'date': incomingAlarm,
          'matched': false
        }).toArray((err, alarmArr) =>{
          if(alarmArr[0]){
            console.log('match found...', alarmArr[0])
            //make sure it isn't this user's alarm...
            //and if it is, respond that the user has already set this alarm
            mdb.collection('alarms').find({
              'user': user,
              'date': incomingAlarm,
              'matched': false
            }).toArray((err, result)=>{
              if (result[0]){
                console.log('..but its a duplicate request from the user')
                ws.send(JSON.stringify({'alreadySet': null}))
              } else {
                console.log('scheduling collaborative game')
                //set alarm id in database for both users
                console.log(`users are ${user} and ${alarmArr[0].user}`)
                let alarmID = scheduleCollabAlarm(incomingAlarm, user, alarmArr[0].user)
                let alarmObj = {}
                alarmObj['id'] = alarmID
                alarmObj['date'] = incomingAlarm
                ws.send(JSON.stringify({'alarmConfirm': alarmObj}))

              }
            })
          }
          //otherwise, add alarm to database and schedule one player alarm
          else {
            console.log('no match found, inserting...')
            mdb.collection('alarms').insert({
              user: user,
              date: incomingAlarm,
              matched: false
            }, (err, result)=> {
              console.log('inserted, expecting null', err)
            })
            console.log('scheduling single player game')
            let alarmID = scheduleSingleAlarm(incomingAlarm, user)
            let alarmObj = {}
            alarmObj['id'] = alarmID
            alarmObj['date'] = incomingAlarm
            ws.send(JSON.stringify({'alarmConfirm': alarmObj}))

          }
        })
        break;

      case 'deleteAlarm':
        //find room in user's alarm collection
        //broadcast message that users are unlinked
        //delete room
        delete alarmsObj[message]
        //delete alarm

        console.log(message)
        break;
      case 'gameState2':
        let key = Object.keys(message)[0]
        let newState = message[key]

        //update server's game state
        twoPlayerGames[key] = newState

        let newGameState = {}
        newGameState[key] = twoPlayerGames[key]

        message[key].users.forEach((user)=>{
          clients[user].send({gameState2: newGameState})
        })

        if (checkForSolution(newState)){
          //turn off pi if there are no more active games

          message[key].users.forEach((user)=>{
            clients[user].send({'gameOver': key})
            mdb.collection('users').update({user: user},
              {$pop:{games: -1}
              })

          //sendMessage('gameOver', Object.keys(message)[0])
          //delete from users active game
          //mdb.collection('users').update({'user': user}, {$set{}})
          //delete from onePlayerGames
          delete twoPlayerGames[key]

        })
      }

        break;
      case 'gameState1':
        //check for solutions here, too???

        //computer makes a move
        let newSingleState = computerMove(message[Object.keys(message)[0]])

        let returningState = {}
        returningState[Object.keys(message)[0]] = newSingleState
        sendMessage('gameState1', returningState)

        //check game state against solution!
        //if solution...
        if (checkForSolution(newSingleState)){
          //turn off pi if there are no more active games
          sendMessage('gameOver', Object.keys(message)[0])
          //delete from users active game
          mdb.collection('users').update({user: user},
            {$pop:{games: -1}
            })

          //mdb.collection('users').update({'user': user}, {$set{}})
          //delete from onePlayerGames
          delete onePlayerGames[Object.keys(message)[0]]
        }
        //if no solution
        else {
          //update server's game state
          onePlayerGames[Object.keys(message)[0]] = newSingleState

        }

        break;
      case 'pi':
        console.log(message)
        //handle
        checkAlarmState === 'on' ? ws.send('on') : ws.send('off')
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


  // ws.send('you got it bitch')

  console.log("websocket connection open")

  ws.on('close', function close(){
    console.log('connection closing')
    delete clients[user]
  })

})
