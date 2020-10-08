const Device = require('./Device.js');
const Mqtt = require("async-mqtt");
const Hcitool = require("./Hcitool.js")
const _ = require('lodash');

class BluetoothScanner{
    constructor(settings){
        this._devices = [];
        this._queue = [];
        this._timer = 0;
        this._settings = this._defaultSettings(settings);
        this._client = Mqtt.connect("tcp://"+settings.mqtt.broker+":"+settings.mqtt.port, {"username": settings.mqtt.username, "password": settings.mqtt.password});
        for(let knownDevice of settings.knownDevices){
            // create a device object.
            let device = new Device(knownDevice); 
            device.subscribeConfidence(this._retry(device));
            this.addDevice(device);
        }
    }

    
    addDevice(device){
        this._devices.push(device);
    }


    _defaultSettings(settings){
        let defaults = {
            mqtt: {
                "broker": "127.0.0.1",
                "port": "18833",
                "username": "username",
                "password": "password",
                "topic_root": "presence"
            },
            "searchDelaySec": 60,
            "knownDevices" : []
        };
        return _.defaultsDeep(settings, defaults);
    }

    async listenForMessages(){
        let topic = this._settings.mqtt.topic_root + "/scan";
        await this._client.subscribe(topic);
        this._client.on('message', (topic, message)=>{
            switch(topic.toString()){
                case this._settings.mqtt.topic_root + "/scan":
                    try{
                        let msg = JSON.parse(message.toString());
                        if(typeof msg.addresses !== 'undefined'){
                            let devices = this._devices.filter(device => {return msg.addresses.includes(device.mac)});
                            this._processDevices(devices);  
                        }else{
                            this._processDevices();  
                        }
                    }catch(e){
                        this._processDevices();  
                    }
                    break;
            }
        });
    }

    async startScanning(){
        try{
            await this._processDevices();
        }catch(e){
            console.log(e);
        }
        return;
    }

    async _searchForDevice(device){
        try{
            let result = await Hcitool.searchForDevice(device.mac);
            if(result.toString()){
                device.confidence = device.confidence+20;
                return true;
            }else{
                device.confidence = device.confidence-20;
                return false;
            }
        }catch(e){
            console.log(e);
            console.log("Error trying to use hcitool. Message: %s", e.toString());
        }
    }

    _retry(device){
        return (confidence, rising) =>{
            console.log("retrying %s, conficence: %s, rising: %s", device.name, confidence, rising);
            this._queue.push(device);
        }
    }

    async _processDevices(devices = this._devices){
        if(typeof devices === 'undefined'){devices = this._devices};
        console.log("starts scanning");
        // Clear the timeout, to make sure no other scaning is started
        
        // queue the objects, and process them 
        for(let device of devices){
            this._queue.push(device);
        } 
        if(this._isRuning){console.log("already runnninng");return};
        this._isRuning = true;
        clearTimeout(this._timer);
        // Wait until all scans are complete.   
        while(this._queue.length > 0){
            // take from front, to make it like a fifo queue
            let res = this._queue.shift();
            await this._searchForDevice(res);
        }
        this._timer = setTimeout(()=>{this._processDevices(this._devices)}, this._settings.searchDelaySec*1000); 
        this._isRuning = false;
        console.log("Stops scanning");
    }

}

module.exports = BluetoothScanner;