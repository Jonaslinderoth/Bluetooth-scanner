let settings = require('./settings.json');
const Device = require('./Device.js');
const spawn = require('await-spawn');
const BluetoothScanner = require('./BluetoothScanner');


let main = async function(){
    let scanner = new BluetoothScanner(settings);
    scanner.listenForMessages();
    scanner.startScanning();
}

main();