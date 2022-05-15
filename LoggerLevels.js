let debug = 0;
let info = 1; 
let warning = 2;
let error = 3;


class LoggerLevels {
    /**
     * @returns {Number}
     */
    static get debug() {
      return debug;
    }
  
    /**
     * @returns {Number}
     */
    static get info() {
      return info;
    }

    /**
     * @returns {Number}
     */
    static get warning(){
        return warning;
    }

    /**
     * @returns {Number}
     */
    static get error(){
        return error;
    }
  }

module.exports = LoggerLevels;