const Device = require('./Device.js');
const spawn = require('await-spawn');


class BluetoothScanner{
    constructor(settings){
        this._devices = [];
        this._queue = [];
        this._timer = 0;
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

    startScanning(){
        try{
            await this.processDevices();
        }catch(e){
            console.log(e);
        }
    }

    async _searchForDevice(device){
        try{
            let result = await spawn('hcitool', ['-i', 'hci0','name', device.mac]);
            if(result.toString()){
                device.confidence = device.confidence+20
                return true;
            }else{
                device.confidence = device.confidence-20
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
            queue.push(this._searchForDevice(device));
        }
    }

    async _processDevices(){
        // queue the objects, and process them 
        for(let device of this._devices){
            this._queue.push(this._searchForDevice(device));
        }        
        for(let res of queue){
            await res;
        }
        clearTimeout(this._timer);
        this._timer = setTimeout(this._processDevices, 50000); // 50 seconds
    }

}

module.exports = BluetoothScanner;