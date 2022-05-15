class Device{
    /**
     * @constructor
     * @param {{mac: String, name: String, confidence: Number|undefined, present: Boolean|undefined}} device 
     * @throws {Error} Mac address not defined or Name not defined
     */
    constructor(device){
        if(typeof device.mac !== 'undefined'){
            this.mac = device.mac;
        }else{
            throw Error("Mac address is not defined");
        }

        if(typeof device.name !== 'undefined'){
            this.name = device.name;
        }else{
            throw Error("Name not defined");
        }

        if(typeof device.confidence !== 'undefined'){
            this.confidence = /** @type {Number} */(device.confidence);
        }else{
            this.confidence = 0;
        }

        // Only override if in setting, otherwise fixed by setter of confidence
        if(typeof device.present !== 'undefined'){
            this.present = /** @type {Boolean} */ device.present;
        }
    }
    
    /**
     * @returns {String} returns the mac address
     */
    get mac(){
        return this._mac;
    }

    /**
     * @param {String} mac the mac address to set
     */
    set mac(mac){
        this._mac = mac;
    }

    /**
     * @returns {String} human readable name
     */
    get name(){
        return this._name;
    }

    /**
     * @param {String} name the friendly name to set
     */
    set name(name){
        this._name = name;
    }

    /**
     * The confidence is how sure the device is home
     * @returns {Number} confidence 
     */
    get confidence(){
        return this._confidence;
    }

    /**
     * The confidence is clamped to be in [0,100]
     * it then notifies the confidence subscribers
     * @param {Number} confidence the confidence
     */
    set confidence(confidence){
        let value = confidence; 
        value = Math.min(100,value);
        value = Math.max(0, value);
        let rising = value > this._confidence;
        if(value == this._confidence){return};
        this._confidence = value;
        if(this._confidence >= 100){
            this.present = true;
        }else if(this._confidence <= 0){
            this.present = false;
        }
        this.notifyConfidence(rising)
    }

    /**
     * Subscribe to confidence changes
     * @param {Function} observer the observer to be called when confidence is changed
     */
    subscribeConfidence(observer){
        if(typeof this._confidenceObservers !== 'undefined'){
            this._confidenceObservers.push(observer);
        }else{
            this._confidenceObservers = [observer];
        }
    }

    /**
     * Call the confidence subscribers
     * @param {Boolean} rising If the confidence is rising or falling
     */
    notifyConfidence(rising){
        for(let key in this._confidenceObservers){
            let observer = this._confidenceObservers[key];
            observer(this.confidence, rising);
        }
    }

    /**
     * If the device is precent or not
     * @returns {Boolean} if the device is considered detected or nor
     */
    get present(){
        return this._present;
    }

    /**
     * setter for precense, and call presence observers
     * If the present is different than the old then notify about the change
     * @param {Boolean} present the presence to set
     */
    set present(present){
        let oldPresent = this._present;
        this._present = present;
        if(oldPresent != present){
            this.notifyPresent();
        }
    }

    /**
     * Subscribe to present changes
     * @param {Function} observer 
     */
    subscribePresent(observer){
        if(typeof this._presentObservers !== 'undefined'){
            this._presentObservers.push(observer);
        }else{
            this._presentObservers = [observer];
        }
    }

    /**
     * Notify the present observers
     */
    notifyPresent(){
        for(let key in this._presentObservers){
            let observer = this._presentObservers[key];
            observer(this._present);
        }
    }

}

module.exports = Device;