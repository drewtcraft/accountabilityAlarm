function createSinglePlayerGameState(user){
  let gameState = {}
  gameState[type] = 'single'
  gameState[user] = user

  let threeRandos = []
  while(threeRandos.length < 3){
    threeRandos = appendUniqueNumber(threeRandos, 26)
  }

  gameState[solution] = threeRandos
  gameState[state] = []

  let obj = {}
  obj[`${date}${user}`] = gameState

  return obj
}

function createTwoPlayerGameState(user1, user2){
  let gameState = {}
  gameState[type] = 'multi'
  gameState[users] = []
  gameState[users].push(user1)
  gameState[users].push(user2)

  let threeRandos = []
  while(threeRandos.length < 3){
    threeRandos = appendUniqueNumber(threeRandos, 26)
  }

  gameState[solution] = threeRandos
  gameState[state] = []
  gameState[turn] = user1

  let obj = {}
  obj[`${date}${user1}${user2}`] = gameState

  return obj
}

module.exports = {
  createSinglePlayerGameState,
  createTwoPlayerGameState
}
