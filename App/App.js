import React from 'react';
import { StyleSheet, Text, View, Button, AsyncStorage} from 'react-native';
const helper = require('./helper.js')



export default class App extends React.Component {
  constructor(props) {
    super(props);


    this.sendInfo = this.sendInfo.bind(this)
    this.sendMessage = this.sendMessage.bind(this)
    this.getUser = this.getUser.bind(this)
    this.saveUser = this.saveUser.bind(this)
  }

  componentWillMount(){
    this.getUser().then((data)=> {
      this.setState({
        user: data
      })
    })

  }

  componentDidMount() {
      ws = new WebSocket('ws://173.2.3.175:3001');
      ws.onopen = () => {
        console.log('cnxn est')

        if(this.state.user !== 'no_user' || this.state.user !== null ){
          console.log('user:', this.state.user)
          this.sendMessage(this.state.user)
        } else {
          console.log('no user detected, generating new id')
          this.sendMessage('no_user')
        }

      }


        ws.onmessage = (message) => {
          let parsedMessage = JSON.parse(message.data)['message']

          if(parsedMessage['newUser']){
            console.log('new user id is', parsedMessage['newUser'])
            this.saveUser(parsedMessage['newUser'])
          } else {
            console.log('should not fire')
          }
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

    sendMessage(payload){
      ws.send(JSON.stringify({message: payload}))
    }

  sendInfo(){
    this.ws.send(JSON.stringify({message: 'hey'}))
  }



  render() {
    return (
      <View style={styles.container}>
        <Button title='shit' onPress={()=>{this.sendInfo()
          console.log('shjti')
        }} />
        <Text >Open up App.js to start working on your app!</Text>
        <Text>Changes you make will automatically reload.</Text>
        <Text>Shake your phone to open the developer menu.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});