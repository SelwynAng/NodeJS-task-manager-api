//Creating our own mock version of the mailgun NPM module

module.exports = function (apiKey, domain) {
    const object2 = {
      send() {
   
      }
    }
   
    const object1 = {
      messages() {
        return object2
      }
    }
   
    return object1
  }

//Okay, I actually have no idea how this works^