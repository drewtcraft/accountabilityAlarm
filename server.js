
const WebSocket = require('ws');


const wss = new WebSocket.Server({ port: 3001 });

let clients = []

wss.on('connection', function connection(ws, req) {
  console.log((req.connection.remoteAddress))

  ws.on('message', function incoming(message) {
    console.log(JSON.parse(message)['message'])

    //check what sort of data is coming in and do something accordingly

    switch(JSON.parse(message)['message']){
      case 'no_user':
        let user_id = req.connection.remoteAddress + `${Math.floor(Math.random()*1000)}`
        ws.send(JSON.stringify({message: {newUser: user_id}}))
    }




  });

});
