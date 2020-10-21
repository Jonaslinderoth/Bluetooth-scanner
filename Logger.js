let Levels = require('./LoggerLevels.js')
class Logger{   
    constructor(level = Levels.info){
        this._level = level;
    }

    info(msg, ...rest){
        let value = this._level >= Logger.info;
        if(this._level >= Levels.info){
            console.log(msg, ...rest);
        }
    }


    debug(msg, ...rest){
        if(this._level >= Levels.debug){
            console.log(msg, ...rest);
        }
    }

    error(msg, ...rest){
        if(this._level >= Levels.error){
            console.log(msg, ...rest);
        }
    }
    
    
    error(warning, ...rest){
        if(this._level >= Levels.warning){
            console.log(msg, ...rest);
        }
    }
}

module.exports = Logger;