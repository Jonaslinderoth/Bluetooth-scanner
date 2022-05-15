let Levels = require('./LoggerLevels.js')

class Logger{   
    /**
     * Creates a logger
     * @param {Number} [level = Levels.info]
     */
    constructor(level = Levels.info){
        this._level = level;
    }

    /**
     * Log at the info level
     * @param {String} msg message to log
     * @param  {...String} rest More messages to log
     */
    info(msg, ...rest){
        if(this._level >= Levels.info){
            console.log(msg, ...rest);
        }
    }

    /**
     * Log at the debug level
     * @param {String} msg message to log
     * @param  {...String} rest More messages to log
     */
    debug(msg, ...rest){
        if(this._level >= Levels.debug){
            console.log(msg, ...rest);
        }
    }

    /**
     * Log at the error level
     * @param {String} msg message to log
     * @param  {...String} rest More messages to log
     */
    error(msg, ...rest){
        if(this._level >= Levels.error){
            console.log(msg, ...rest);
        }
    }
    
    /**
     * Log at the warning level
     * @param {String} msg message to log
     * @param  {...String} rest More messages to log
     */
    warning(msg, ...rest){
        if(this._level >= Levels.warning){
            console.log(msg, ...rest);
        }
    }
}

module.exports = Logger;