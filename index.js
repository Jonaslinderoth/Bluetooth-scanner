let settings = require('./settings.json');
const Device = require('./Device.js');
const spawn = require('await-spawn');


let queue = [];
let devices = [];
let timer = 0;
let searchForDevice = async function(device){
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

let retry = function(device){
    return (confidence, rising) =>{
        console.log("retrying %s, conficence: %s, rising: %s", device.name, confidence, rising);
        queue.push(searchForDevice(device));
    }
}




let main = async function(){
    // Generate devices from settings.
    for(let knownDevice of settings.knownDevices){
        // create a device object.
        let device = new Device(knownDevice); 
        device.subscribeConfidence(retry(device));
        devices.push(device);
    }     
    try{
        await processDevices();
    }catch(e){
        console.log(e);
    }
}

main();