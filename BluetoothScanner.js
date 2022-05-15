const Device = require('./Device.js');
const Mqtt = require("async-mqtt");
const Hcitool = require("./Hcitool.js")
const _ = require('lodash');
const Logger = require('./Logger.js');

class BluetoothScanner{
    /**
     * @constructor
     * @param {Object} settings the settings to add
     * @param {Logger} logger   the logger to use
     */
    constructor(settings, logger = new Logger()){
        this._logger = logger;
        this._devices = [];
        this._queue = [];
        this._timer = undefined;
        this._settings = this._defaultSettings(settings);
        this._client = Mqtt.connect("tcp://"+settings.mqtt.broker+":"+settings.mqtt.port, {"username": settings.mqtt.username, "password": settings.mqtt.password});
        for(let knownDevice of settings.knownDevices){
            // create a device object.
            let device = new Device(knownDevice); 
            this.addDevice(device);
        }
    }

    /**
     * Adds a device to the listeners
     * @param {Device} device the device to add
     */
    addDevice(device){
        device.subscribeConfidence(this._retry(device));
        device.subscribeConfidence(this._sendMessage(device));
        device.subscribePresent(this._sendHomeMessage(device));
        this.subscribeEndScan(this._sendHomeMessage(device));
        this._devices.push(device);
    }


    /**
     * Add a subscriber to the end scan
     * @param {Function} observer Subscriber to the end scan
     */
    subscribeEndScan(observer){
        if(typeof this._endScanObservers !== 'undefined'){
            this._endScanObservers.push(observer);
        }else{
            this._endScanObservers = [observer];
        }
    }


    notifyEndScan(){
        for(let key in this._endScanObservers){
            let observer = this._endScanObservers[key];
            observer();
        }
    }


    /**
     * @param {Object}  settings 
     * @returns {Object}
     */
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


    /**
     * Subscribe to incomming MQTT Messages
     * Call the device processor function on each message
     */
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

    /**
     * Start the scanning of device presence
     * @returns {Promise}
     */
    async startScanning(){
        try{
            await this._processDevices();
        }catch(e){
            this._logger.info(e);
        }
        return;
    }

    /**
     * Do the device scan, and increase / decrease confidence 
     * @param {Device} device the device to scan for
     * @returns {Promise<Boolean>} if the device is more likely to be present or not
     */
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
            this._logger.debug("Error trying to use hcitool. Message: %s", e.toString());
        }
    }

    /**
     * Retry a scan of the device
     * @param {Device} device 
     * @returns {Function} that adds the device to the queue
     */
    _retry(device){
        return (confidence, rising) =>{
            this._logger.info("retrying %s, conficence: %s, rising: %s", device.name, confidence, rising);
            this._queue.push(device);
        }
    }

    /**
     * returns a function that publishes the message
     * @param {Device} device device to send MQTT message about
     * @returns {Function}
     */
    _sendMessage(device){
        return (confidence, rising) => {
            let message = {
                'confidence' : confidence, 
                'presence' : device.present
            }
            let topic = this._settings.mqtt.topic_root + "/" + device.name; 
            this._client.publish(topic, JSON.stringify(message));
        }
    }
    
    /**
     * 
     * @param {Device} device The device to send the message for
     * @returns {Function} function that takes a boolean 
     */
    _sendHomeMessage(device){
        return (present) => {
            if(typeof present === 'undefined'){
                present = device.present;
            }
            let message = present? "home" : "not_home";

            let topic = this._settings.mqtt.topic_root + "/" + device.name + "/device_tracker"; 
            this._client.publish(topic, message);
        }
    }

    /**
     * Start the scanning of all devices in the list.  
     * @param {Device[]} devices devices to scan for
     * @returns {Promise}
     */
    async _processDevices(devices = this._devices){
        if(typeof devices === 'undefined'){devices = this._devices};
        this._logger.info("starts scanning");
        // Clear the timeout, to make sure no other scaning is started
        
        // queue the objects, and process them 
        for(let device of devices){
            this._queue.push(device);
        } 
        if(this._isRuning){this._logger.info("already runnninng");return};
        this._isRuning = true;
        clearTimeout(this._timer);
        // Wait until all scans are complete.   
        while(this._queue.length > 0){
            // take from front, to make it like a fifo queue
            let res = this._queue.shift();
            await this._searchForDevice(res);
        }
        this._timer = setTimeout(()=>{this._processDevices(this._devices)}, this._settings.searchDelaySec*1000); 
        this.notifyEndScan()
        this._isRuning = false;
        this._logger.info("Stops scanning");
    }
}

module.exports = BluetoothScanner;