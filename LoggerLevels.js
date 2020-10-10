let debug = 0;
let info = 1; 
let warning = 2;
let error = 3;
class LoggerLevels {
    static get debug() {
      return debug;
    }
  
    static get info() {
      return info;
    }

    static get warning(){
        return warning;
    }

    static get error(){
        return error;
    }
  }

module.exports = LoggerLevels;