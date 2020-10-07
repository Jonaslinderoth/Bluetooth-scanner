class Device{
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
            this.confidence = device.confidence;
        }else{
            this.confidence = 0;
        }

        // Only override if in setting, otherwise fixed by setter of confidence
        if(typeof device.present !== 'undefined'){
            this.present = device.present;
        }
    }
    
    get mac(){
        return this._mac;
    }

    set mac(mac){
        this._mac = mac;
    }

    get name(){
        return this._name;
    }

    set name(name){
        this._name = name;
    }

    get confidence(){
        return this._confidence;
    }

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

    subscribeConfidence(observer){
        if(typeof this._confidenceObservers !== 'undefined'){
            this._confidenceObservers.push(observer);
        }else{
            this._confidenceObservers = [observer];
        }
    }

    notifyConfidence(rising){
        for(let key in this._confidenceObservers){
            let observer = this._confidenceObservers[key];
            observer(this.confidence, rising);
        }
    }

    get present(){
        return this._present;
    }

    set present(present){
        let oldPresent = this._present;
        this._present = present;
        if(oldPresent != present){
            this.notifyPresent();
        }
    }

    subscribePresent(observer){
        if(typeof this._presentObservers !== 'undefined'){
            this._presentObservers.push(observer);
        }else{
            this._presentObservers = [observer];
        }
    }

    notifyPresent(){
        for(let key in this._presentObservers){
            let observer = this._presentObservers[key];
            observer(this._present);
        }
    }

}

module.exports = Device;