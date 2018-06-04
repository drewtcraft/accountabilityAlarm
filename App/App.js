import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Button, AsyncStorage, DatePickerIOS, TouchableWithoutFeedback} from 'react-native';
import { createBottomTabNavigator } from 'react-navigation';


class ConnectionStatus extends React.Component {
  constructor(props){
    super(props)
    this.state={
      connection: false
    }
    this.connect = this.connect.bind(this)
    this.sendMessage = this.sendMessage.bind(this)
    this.getUser = this.getUser.bind(this)
    this.saveUser = this.saveUser.bind(this)
    this.saveAlarm = this.saveAlarm.bind(this)


  }

  componentWillMount(){
    this.getUser().then((data)=> {
      this.setState({
        user: data
      })
    })
  }


    componentDidMount() {

      this.connect()


    }

  connect(){
    //ws = new WebSocket('ws://accountability-alarm.herokuapp.com/:5000');
    ws = new WebSocket('ws://173.2.3.175:5001')
    ws.onopen = () => {
      console.log('cnxn est')
      this.setState({
        connection: true
      })

      //if there is no user (found in cWM), send 'no_user'
      if(this.state.user !== 'no_user'){
        console.log('user:', this.state.user)
        this.sendMessage('user', this.state.user)
      } else {
        console.log('no user detected, generating new id')
        this.sendMessage('user', 'no_user')
      }
    }

    ws.onmessage = (data) => {
      const messageType = Object.keys(JSON.parse(data.data))[0]
      const message = JSON.parse(data.data)[messageType]
      console.log('type:', messageType,':', message)
      switch(messageType){
        case 'new_id':
          this.saveUser(message)
          this.getUser()
          break;
        case 'gameState2':
          this.setState({
            gameState: message,
            turn: message['turn']
          })
          break;
        case 'gameState1':
        console.log(message)
          this.setState({
            gameState: message

          })
          console.log('state:', this.state)
          break;
        case 'gameOver':
          console.log('little fuck face')
          this.setState({
            gameState: undefined,
            turn: undefined
          })
          Alert.alert('you did it!')

          break;
        case 'alarmConfirm':
          console.log('alarm save confirmed')
          this.saveAlarm(message)
          Alert.alert('alarm set!')
        break;
        case 'alreadySet':
          console.log('alarm exists')
          Alert.alert('alarm already exists')
        break;

        default:
          break;
      }
    }
    ws.onclose = ()=>{
      ws['closed'] = true
      this.setState({
        connection: false
      })
      console.log('connection closed')

    }
  }


    async getUser(){
      try {
        const value = await AsyncStorage.getItem('@MyStore:user');
        if (value !== null){
          console.log('value', value)
          return value
        }
        return 'no_user'
      } catch (error) {
        console.log(error)
        return 'no_user'

      }
    }

    async saveUser(user_id){
      try {
        await AsyncStorage.setItem('@MyStore:user', user_id);
        console.log('suxess')
      } catch (error) {
        console.log(user_id, 'not saved', error)
      }
    }

    sendMessage(type, payload){
      let obj = {}
      obj[type] = payload
      ws.send(JSON.stringify(obj))
    }

    async saveAlarm(alarmObj){
      console.log('alarmObj', alarmObj)
      let alarms = await this.getAlarms()
      if(alarms === undefined){
        alarms = {}
        alarms[alarmObj['date']] = alarmObj['id']
      } else {
        alarms[alarmObj['date']] = alarmObj['id']
      }

      try {
        await AsyncStorage.setItem('@MyStore:alarms', JSON.stringify(alarms));
        console.log('suxess')
      } catch (error) {
        console.log(alarmObj, 'not saved', error)
      }
    }

    render(){
      let connectionStatus = (<Text></Text>)
      if(this.state.connection === false){
        connectionStatus = (
          <View>
            <Text>disconnected from server <Button title='reconnect' onPress={()=>{
              this.connect()
            }} /></Text>
          </View>)
      }
      return(<View>
          {connectionStatus}
        </View>)
    }


}


class GameState extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      chosenDate: new Date(),
      turn: undefined

     };

    this.sendMessage = this.sendMessage.bind(this)
    this.sendGameState2 = this.sendGameState2.bind(this)
    this.sendGameState1 = this.sendGameState1.bind(this)
    this.getAlarms = this.getAlarms.bind(this)
    this.getUser = this.getUser.bind(this)
  }



  componentWillMount(){
    this.getUser().then((data)=> {
      this.setState({
        user: data
      })
    })
  }


      async getUser(){
        try {
          const value = await AsyncStorage.getItem('@MyStore:user');
          if (value !== null){
            console.log('value', value)
            return value
          }
          return 'no_user'
        } catch (error) {
          console.log(error)
          return 'no_user'

        }
      }



  async sendGameState1(num){
    console.log('gamestate1 firing', this.state)
    await this.setState((prevState)=>{
      console.log('entering setState')
    let prevGameState = prevState.gameState[Object.keys(prevState.gameState)[0]]
    console.log('prevgamestate established')
    console.log(prevGameState.state)

    prevGameState['state'].push(num)
    console.log(prevGameState.state)

    console.log('num pushed')
    let obj = {}
    obj[Object.keys(prevState.gameState)[0]] = prevGameState
    console.log('new state set up')
    return {gameState: obj}

    })
    this.sendMessage('gameState1', this.state.gameState)

  }

  async sendGameState2(num){

    console.log('gamestate2 firing', this.state)
    await this.setState((prevState)=>{
      console.log('entering setState')
    let prevGameState = prevState.gameState[Object.keys(prevState.gameState)[0]]
    console.log('prevgamestate established')
    console.log(prevGameState.state)

    prevGameState['state'].push(num)
    console.log(prevGameState.state)

    console.log('num pushed')

    prevGameState['turn'] = this.state.user === prevGameState['users'][0]
      ? prevGameState['users'][0] : prevGameState['users'][1]

    let obj = {}
    obj[Object.keys(prevState.gameState)[0]] = prevGameState
    console.log('new state set up')
    return {gameState: obj}

    })
    this.sendMessage('gameState2', this.state.gameState)
  }



  async getAlarms(){
    try {
      const value = await AsyncStorage.getItem('@MyStore:alarms');
      if (value !== null){
        return JSON.parse(value)
      }
    } catch (error) {
      console.log(error)
      return {}
    }
  }


  sendMessage(type, payload){
    let obj = {}
    obj[type] = payload
    ws.send(JSON.stringify(obj))
  }



  render() {

    let turn = (<View></View>)




    let tileFunc = ()=>{}
    let tiles = (<Text>No Active Games</Text>)

    if(this.state.gameState !== undefined){
      turn = (<Text>player game</Text>)
      if(this.state.turn !== undefined){
        turn = this.state.turn === this.state.user
        ? (<Text>your turn</Text>) : (<Text>not your turn</Text>)
      }

      console.log('gametype', Object.keys(this.state.gameState)[0])
      tileFunc = this.state.gameState[Object.keys(this.state.gameState)[0]]['type'] === 'single'
        ? this.sendGameState1 : this.sendGameState2
      this.state.gameState[Object.keys(this.state.gameState)[0]]['state']

      tiles = []

      let hit = this.state.gameState[Object.keys(this.state.gameState)[0]]['state']
      let solutionHit = this.state.gameState[Object.keys(this.state.gameState)[0]]['solution']
      console.log('hit', hit)
      console.log('solutions', solutionHit)
      for(let i = 0; i < 25; i++){
        //if tile has been clicked
        if(hit.indexOf(i) !== -1 && solutionHit.indexOf(i) !== -1){
          tiles.push(<TouchableWithoutFeedback key={i} onPress={()=>{
            console.log('tile hit')
            }}>
          <View style={styles.solutionHitTile}></View>
          </TouchableWithoutFeedback>)
        } else if (hit.indexOf(i) !== -1){
          tiles.push(<TouchableWithoutFeedback key={i} onPress={()=>{
            console.log('tile hit')
            }}>
          <View style={styles.hitTile}></View>
          </TouchableWithoutFeedback>)
        }

        else {
        tiles.push(<TouchableWithoutFeedback key={i} onPress={()=>{
          console.log('tile hit', this.state)
          tileFunc(i)}}>
        <View style={styles.tile}></View>
        </TouchableWithoutFeedback>)
      }
    }

  }

  let gameBoard =  (<View pointerEvents='auto' style={styles.tileContainer}>

    {tiles}

  </View>)

    if(this.state.turn !== undefined){

     gameBoard = (<View pointerEvents={this.state.turn === user ? 'auto' : 'none'}>

     {tiles}
</View>)
}







    return (
      <View style={styles.container}>
      <ConnectionStatus />
        {turn}
        {gameBoard}

      </View>
    );
  }
}



class SetAlarm extends React.Component {
  constructor(props){
    super(props)

    this.state = {
      chosenDate: new Date()
    }

    this.setAlarm = this.setAlarm.bind(this)
    this.setDate = this.setDate.bind(this)
  }

  setAlarm(){
    if(!ws['closed'])
      { ws.send(JSON.stringify({'setAlarm': this.state.chosenDate}))}
      else{Alert.alert('connection lost')}
      }

  setDate(newDate) {
    this.setState({chosenDate: newDate})

 }



  render(){
    return(

      <View style={styles.datePicker}>
      <ConnectionStatus />

      <DatePickerIOS
        date={this.state.chosenDate}
        onDateChange={this.setDate}
      />
      <Button title='set alarm' onPress={
        this.setAlarm
      } />
      </View>
    )
  }
}


class MyAlarm extends React.Component {
  constructor(props){
    super(props)

    this.state = {
      alarms: []
    }
    this.deleteAlarm = this.deleteAlarm.bind(this)
  }


  componentWillMount(){
    this.getAlarms()
  }

  async getAlarms(){
    try {
      const value = await AsyncStorage.getItem('@MyStore:alarms');
      if (value !== null){
        this.setState({alarms: JSON.parse(value)})
      }
    } catch (error) {
      console.log(error)

    }
  }

  async deleteAlarm(alarm){
    console.log('delete firing')
    ws.send(JSON.stringify({'fuck': 'shit'}))
    ws.send({'deleteAlarm': this.state.alarms[alarm]})
    console.log('ws working')
    this.setState((prevState)=>{
      delete prevState.alarms[alarm]
      return {alarms: prevState.alarms}
    })
    console.log('just before async shit')
    try {
      console.log('firing');
      await AsyncStorage.setItem('@MyStore:alarms', JSON.stringify(this.state.alarms));
      console.log('suxess')
    } catch (error) {
      console.log( error)
    }

  }

  render(){
    let alarms = Object.keys(this.state.alarms).map((alarm, i)=>{
      return (
        <View style={styles.alarm} key={i}>

          <Text >{alarm}</Text>
          <Button title='remove alarm' onPress={()=>{
            this.deleteAlarm(alarm)

          }} />
        </View>)
    })

    return(
      <View style={styles.container}>
      <ConnectionStatus />

      <ScrollView contentContainerStyle={styles.myAlarms}>

        {alarms}
      </ScrollView>
      </View>
    )
  }
}




export default createBottomTabNavigator({
  Home: GameState,
  SetAlarm: SetAlarm,
  MyAlarm: MyAlarm
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignSelf: 'center',
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tile: {
    backgroundColor: '#000',
    width: '19%',
    height: '19%',
    borderColor: 'white',
    borderWidth:2
  },
  tileContainer: {
    flex: 0,
    height: '50%',
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  datePicker : {
    flex: 1,
    width: '100%',
    justifyContent:'center'
  },
  myAlarms: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  alarm: {
    borderColor: 'red',
    borderWidth: 1
  },
  hitTile: {
    backgroundColor: '#BBB',
    width: '19%',
    height: '19%',
    borderColor: 'white',
    borderWidth:2
  },
  solutionHitTile: {
    backgroundColor: '#444',
    width: '19%',
    height: '19%',
    borderColor: 'white',
    borderWidth:2
  }
});
