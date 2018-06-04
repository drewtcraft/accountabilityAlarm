function appendUniqueNumber(arr, max){
  let originalLength = arr.length
  while(originalLength === arr.length){
    let num = Math.floor(Math.random() * max)
    if(arr.indexOf(num) === -1)
    {arr.push(num)}
  }
  return arr
}


function singlePlayer(date, user){
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

function twoPlayer(date, user1, user2){
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

module.exports = {singlePlayer, twoPlayer, computerMove, checkForSolution, updateServerGameState}
