module.exports = {
  async saveUser (user_id) {
    try {
      await AsyncStorage.setItem('@MyStore:user', user_id);
    } catch (error) {

    }
  },

  async getUser () {
    try {
      const value = await AsyncStorage.getItem('@MyStore:user');
      if (value !== null){
        // We have data!!
        console.log(value);
        return value
      }
    } catch (error) {
      // Error retrieving data
    }
  }
}
