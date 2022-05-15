let settings = require('./settings.json');
const Device = require('./Device.js');
const spawn = require('await-spawn');
const BluetoothScanner = require('./BluetoothScanner');
const Levels = require('./LoggerLevels');
const Logger = require('./Logger');

let main = async function(){
    let logger = new Logger(Levels.error);
    let scanner = new BluetoothScanner(settings, logger);
    scanner.listenForMessages();
    scanner.startScanning();
}

main();