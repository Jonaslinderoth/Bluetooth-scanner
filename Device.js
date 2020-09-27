class Device{
    constructor(device){
        if(typeof device.mac !== 'undefined'){
            this._mac = device.mac;
        }else{
            throw Error("Mac address is not defined");
        }

        if(typeof device.name !== 'undefined'){
            this._name = device.name;
        }else{
            throw Error("Name  not defined");
        }

        if(typeof device.confidence !== 'undefined'){
            this._confidence = device.confidence;
        }else{
            this._confidence = 0;
        }

        if(typeof device.present !== 'undefined'){
            this._present = device.present;
        }else{
            this._present = false;
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
        if(value == this._confidence){return};
        let rising = value > this._confidence;
        this._confidence = value;
        if(this._confidence >= 100){
            this._present = true;
        }else if(this._confidence <= 0){
            this._present = false;
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
            observer(this._confidence, rising);
        }
    }

    get present(){
        return this._present;
    }

    set present(present){
        this.notifyPresent();
        this._present = present;
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