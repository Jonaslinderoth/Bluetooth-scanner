let Levels = require('./LoggerLevels.js')
class Logger{   
    constructor(level = Levels.debug){
        this._level = level;
    }

    info(msg){
        let value = this._level >= Logger.info;
        if(this._level >= Levels.info){
            console.log(msg);
        }
    }


    debug(msg){
        if(this._level >= Levels.debug){
            console.log(msg);
        }
    }

    error(msg){
        if(this._level >= Levels.error){
            console.log(msg);
        }
    }
    
    
    error(warning){
        if(this._level >= Levels.warning){
            console.log(msg);
        }
    }
}

module.exports = Logger;