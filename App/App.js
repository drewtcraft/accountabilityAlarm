import React from 'react';
import { StyleSheet, Text, View, Button, AsyncStorage, DatePickerIOS} from 'react-native';
const helper = require('./helper.js')



export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { chosenDate: new Date() };

    this.setDate = this.setDate.bind(this);
    this.sendMessage = this.sendMessage.bind(this)
    this.getUser = this.getUser.bind(this)
    this.saveUser = this.saveUser.bind(this)
    this.setAlarm = this.setAlarm.bind(this)
  }

  setAlarm(){
    console.log('button working')
    this.sendMessage('setAlarm', this.state.chosenDate)
  }

  setDate(newDate) {
    //parse new date from nasty weird object
    const year = JSON.stringify(newDate).slice(1, 5)
    const month = `${parseInt(JSON.stringify(newDate).slice(6, 8))-1}`
    const day = JSON.stringify(newDate).slice(9, 11)
    const hourPlusFive = JSON.stringify(newDate).slice(12, 14)
    const hour = `${parseInt(hourPlusFive)-4}`
    const minute = JSON.stringify(newDate).slice(15, 17)

    const stringDate = `${year} ${month} ${day} ${hour} ${minute}`
    const setDate = new Date(year, month, day, hour, minute, 0)
    this.setState({chosenDate: setDate})
 }

  componentWillMount(){
    this.getUser().then((data)=> {
      this.setState({
        user: data
      })
    })
  }

  componentDidMount() {

    //ws = new WebSocket('ws://accountability-alarm.herokuapp.com/:5000');
    ws = new WebSocket('ws://192.168.1.138:5001')

    ws.onopen = () => {
      console.log('cnxn est')

      //if there is no user (found in cWM), send 'no_user'
      if(this.state.user !== 'no_user' || this.state.user !== null ){
        console.log('user:', this.state.user)
        this.sendMessage('user', this.state.user)
      } else {
        console.log('no user detected, generating new id')
        this.sendMessage('user', 'no_user')
      }

    }

    ws.onmessage = (message) => {
      console.log('current message', message.data)
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
    ws.send(JSON.stringify({message: obj}))
  }



  render() {
    return (
      <View style={styles.container}>
        <Button title='set alarm' onPress={()=>{
          this.setAlarm()
        }} />

        <DatePickerIOS
          date={this.state.chosenDate}
          onDateChange={this.setDate}
        />

      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
