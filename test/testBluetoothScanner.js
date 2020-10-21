const chai = require('chai');
const expect = chai.expect;
const Device = require("../Device.js");
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);
const BluetoothScanner = require('../BluetoothScanner.js');
const Mqtt = require("async-mqtt");
const { it } = require('mocha');
const Hcitool = require('../Hcitool.js');
const sandbox = require('sinon').createSandbox();



describe("Test BluetoothScanner",()=>{
    describe("Constructor", ()=>{
        let stub;
        beforeEach(()=>{
            stub = sinon.stub(Mqtt, "connect").returns({
                on: sinon.stub().returnsThis(),
                subscribe: sinon.stub().returnsThis(),
            });
        });

        afterEach(()=>{
            stub.restore(Mqtt);
        });


        it("Should use defaults witn empty settings",()=>{
            let scanner = new BluetoothScanner({});
            expect(stub.calledOnce).to.be.true;
            expect(stub.calledWith("tcp://127.0.0.1:18833", {"username": "username", "password": "password"})).to.be.true;
        });

        it("Should use some defaults when not specified in settings",()=>{
            let scanner = new BluetoothScanner({mqtt: {"broker": "123.456.78.1"}});
            expect(stub.calledOnce).to.be.true;
            expect(stub.calledWith("tcp://123.456.78.1:18833", {"username": "username", "password": "password"})).to.be.true;
        });



        it("Should use some defaults when not specified in settings2",()=>{
            let scanner = new BluetoothScanner({mqtt: {"broker": "123.456.78.1", "username": "hello123"}});
            expect(stub.calledOnce).to.be.true;
            expect(stub.calledWith("tcp://123.456.78.1:18833", {"username": "hello123", "password": "password"})).to.be.true;
        });


        it("Should succeed with minimum settings",()=>{
            let scanner = new BluetoothScanner({
                mqtt: {
                    "broker": "127.0.0.2",
                    "port": "188333",
                    "username": "username3",
                    "password": "password3",
                    "topic_root": "presence"
                },
                "searchDelaySec": 60,
                "knownDevices" : []

            });

            expect(stub.calledOnce).to.be.true;
            expect(stub.calledWith("tcp://127.0.0.2:188333", {"username": "username3", "password": "password3"})).to.be.true;
        });



        it("Should succeed with one element",()=>{
            let scanner = new BluetoothScanner({
                mqtt: {
                    "broker": "127.0.0.2",
                    "port": "188333",
                    "username": "username3",
                    "password": "password3",
                    "topic_root": "presence"
                },
                "searchDelaySec": 60,
                "knownDevices" : [
                    {
                        "name": "phone",
                        "mac": "1:2:3:4"
                    }, 
                ]

            });

            expect(stub.calledOnce).to.be.true;
            expect(stub.calledWith("tcp://127.0.0.2:188333", {"username": "username3", "password": "password3"})).to.be.true;
            expect(scanner._devices).to.have.length(1);
            let device = new Device({"name": "phone","mac": "1:2:3:4"});
            expect(scanner._devices[0].name).to.be.equal(device.name);
            expect(scanner._devices[0].mac).to.be.equal(device.mac);
            expect(scanner._devices[0].confidence).to.be.equal(device.confidence);
        });
    });


    describe("listen for messages", () => {
        let client;
        beforeEach(()=>{
            client = {
                on: sandbox.spy(),
                subscribe: sandbox.spy(),
            };
            sandbox.stub(Mqtt, "connect").returns(client);
        });

        afterEach(()=>{
            sandbox.restore();
        });

        it("should set the callback on message and call all", async ()=>{
            let scanner = new BluetoothScanner({});
            await scanner.listenForMessages();
            sandbox.assert.calledOnce(Mqtt.connect);
            sandbox.assert.calledWith(Mqtt.connect, "tcp://127.0.0.1:18833", {"username": "username", "password": "password"});
            sandbox.assert.calledOnce(client.subscribe);
            expect(client.subscribe.args[0][0]).to.be.equal('presence/scan');

            sandbox.assert.calledOnce(client.on);
            expect(client.on.args[0][0]).to.be.equal('message');

            sandbox.stub(scanner, "_processDevices");

            let topic = {toString : ()=>{return "presence/scan"}};
            let message = {toString: ()=> {return "{}"}};
            client.on.args[0][1](topic, message);
            sandbox.assert.calledOnce(scanner._processDevices);
            sandbox.assert.calledWithExactly(scanner._processDevices);            
        });

        it("should process all devices with ill formed message", async ()=>{
            let scanner = new BluetoothScanner({});
            await scanner.listenForMessages();
            sandbox.assert.calledOnce(Mqtt.connect);
            sandbox.assert.calledWith(Mqtt.connect, "tcp://127.0.0.1:18833", {"username": "username", "password": "password"});
            sandbox.assert.calledOnce(client.subscribe);
            expect(client.subscribe.args[0][0]).to.be.equal('presence/scan');

            sandbox.assert.calledOnce(client.on);
            expect(client.on.args[0][0]).to.be.equal('message');

            sandbox.stub(scanner, "_processDevices");

            let topic = {toString : ()=>{return "presence/scan"}};
            let message = {toString: ()=> {return ""}};
            client.on.args[0][1](topic, message);
            sandbox.assert.calledOnce(scanner._processDevices);
            sandbox.assert.calledWithExactly(scanner._processDevices);            
        });


        it("should process only specific device", async ()=>{
            let scanner = new BluetoothScanner({});
            let device = new Device({'name':"hello", 'mac':'123'});
            sandbox.stub(scanner, "_processDevices");
            scanner.addDevice(device);
            await scanner.listenForMessages();
            sandbox.assert.calledOnce(Mqtt.connect);
            sandbox.assert.calledWith(Mqtt.connect, "tcp://127.0.0.1:18833", {"username": "username", "password": "password"});
            sandbox.assert.calledOnce(client.subscribe);
            expect(client.subscribe.args[0][0]).to.be.equal('presence/scan');

            sandbox.assert.calledOnce(client.on);
            expect(client.on.args[0][0]).to.be.equal('message');


            let topic = {toString : ()=>{return "presence/scan"}};
            let message = {toString : ()=> {return JSON.stringify({'addresses':['123']})}};
            client.on.args[0][1](topic, message);
            sandbox.assert.calledOnce(scanner._processDevices);
            sandbox.assert.calledWith(scanner._processDevices, [device]);            
        });

        it("should process only specific added devices", async ()=>{
            let scanner = new BluetoothScanner({});
            let device = new Device({'name':"hello", 'mac':'123'});
            sandbox.stub(scanner, "_processDevices");
            scanner.addDevice(device);
            await scanner.listenForMessages();
            sandbox.assert.calledOnce(Mqtt.connect);
            sandbox.assert.calledWith(Mqtt.connect, "tcp://127.0.0.1:18833", {"username": "username", "password": "password"});
            sandbox.assert.calledOnce(client.subscribe);
            expect(client.subscribe.args[0][0]).to.be.equal('presence/scan');

            sandbox.assert.calledOnce(client.on);
            expect(client.on.args[0][0]).to.be.equal('message');


            let topic = {toString : ()=>{return "presence/scan"}};
            let message = {toString : ()=> {return JSON.stringify({'addresses':['123', '1234']})}};
            client.on.args[0][1](topic, message);
            sandbox.assert.calledOnce(scanner._processDevices);
            sandbox.assert.calledWith(scanner._processDevices, [device]);            
        });

        it("should process none if not added", async ()=>{
            let scanner = new BluetoothScanner({});
            let device = new Device({'name':"hello", 'mac':'123'});
            sandbox.stub(scanner, "_processDevices");
            scanner.addDevice(device);
            await scanner.listenForMessages();
            sandbox.assert.calledOnce(Mqtt.connect);
            sandbox.assert.calledWith(Mqtt.connect, "tcp://127.0.0.1:18833", {"username": "username", "password": "password"});
            sandbox.assert.calledOnce(client.subscribe);
            expect(client.subscribe.args[0][0]).to.be.equal('presence/scan');

            sandbox.assert.calledOnce(client.on);
            expect(client.on.args[0][0]).to.be.equal('message');


            let topic = {toString : ()=>{return "presence/scan"}};
            let message = {toString : ()=> {return JSON.stringify({'addresses':['1234']})}};
            client.on.args[0][1](topic, message);
            sandbox.assert.calledOnce(scanner._processDevices);
            sandbox.assert.calledWith(scanner._processDevices, []);            
        });

        it("should process none if not added2", async ()=>{
            let scanner = new BluetoothScanner({});
            sandbox.stub(scanner, "_processDevices");
            await scanner.listenForMessages();
            sandbox.assert.calledOnce(Mqtt.connect);
            sandbox.assert.calledWith(Mqtt.connect, "tcp://127.0.0.1:18833", {"username": "username", "password": "password"});
            sandbox.assert.calledOnce(client.subscribe);
            expect(client.subscribe.args[0][0]).to.be.equal('presence/scan');

            sandbox.assert.calledOnce(client.on);
            expect(client.on.args[0][0]).to.be.equal('message');


            let topic = {toString : ()=>{return "presence/scan"}};
            let message = {toString : ()=> {return JSON.stringify({'addresses':[]})}};
            client.on.args[0][1](topic, message);
            sandbox.assert.calledOnce(scanner._processDevices);
            sandbox.assert.calledWith(scanner._processDevices, []);            
        });
    });


    describe('StartScanning', () => {
        let client;
        beforeEach(()=>{
            client = {
                on: sandbox.spy(),
                subscribe: sandbox.spy(),
            };
            sandbox.stub(Mqtt, "connect").returns(client);
        });

        afterEach(()=>{
            sandbox.restore();
        });

        it('Should call processDevices', () => {
            let scanner = new BluetoothScanner({});
            sandbox.stub(scanner, '_processDevices');
            scanner.startScanning();
            sandbox.assert.calledOnce(scanner._processDevices);
        });


        it('Should print error if processDevices rejects', () => {
            let scanner = new BluetoothScanner({});
            sandbox.stub(scanner, '_processDevices').throws();
            sandbox.stub(console, 'log');
            scanner.startScanning();
            sandbox.assert.calledOnce(scanner._processDevices);
            sandbox.assert.calledOnce(console.log);
        });
    });


    describe('_searchForDevice', ()=>{
        let client;
        let scanner;
        beforeEach(()=>{
            client = {
                on: sandbox.spy(),
                subscribe: sandbox.spy(),
            };
            sandbox.stub(Mqtt, "connect").returns(client);
            scanner = new BluetoothScanner({});
        });

        afterEach(()=>{
            sandbox.restore();
        });

        it('Should return true if device found', async () => {
            sandbox.stub(Hcitool, 'searchForDevice').returns("found");
            let device = new Device({mac: "00:20:18:61:f1:8a", name: "testName"});
            expect(device.confidence).to.be.equal(0);
            let result = await scanner._searchForDevice(device);
            expect(result).to.be.true;
            expect(device.confidence).to.be.equal(20);
            sandbox.assert.calledOnce(Hcitool.searchForDevice);

        });

        it('Should return false if no device found', async () => {
            sandbox.stub(Hcitool, 'searchForDevice').returns("");
            let device = new Device({mac: "00:20:18:61:f1:8a", name: "testName"});
            expect(device.confidence).to.be.equal(0);
            let result = await scanner._searchForDevice(device);
            expect(result).to.be.false;
            expect(device.confidence).to.be.equal(0);
            sandbox.assert.calledOnce(Hcitool.searchForDevice);
        });

        it('Should print error if hcitool fails', async () => {
            sandbox.stub(Hcitool, 'searchForDevice').throws();
            sandbox.stub(console, 'log');
            let device = new Device({mac: "00:20:18:61:f1:8a", name: "testName"});
            expect(device.confidence).to.be.equal(0);
            let result = await scanner._searchForDevice(device);
            expect(result).to.be.undefined;
            expect(device.confidence).to.be.equal(0);
            sandbox.assert.calledOnce(Hcitool.searchForDevice);
            sandbox.assert.calledOnce(console.log);
        });
    });



    describe('_retry', () => {
        let client;
        let scanner;
        beforeEach(()=>{
            client = {
                on: sandbox.spy(),
                subscribe: sandbox.spy(),
            };
            sandbox.stub(Mqtt, "connect").returns(client);
            scanner = new BluetoothScanner({});
        });

        afterEach(()=>{
            sandbox.restore();
        });

        it('Should return a function which adds to queue', async () => {
            let device = new Device({mac: "00:20:18:61:f1:8a", name: "testName"});
            expect(device.confidence).to.be.equal(0);
            sandbox.stub(console, 'log');
            expect(scanner._queue.length).to.be.equal(0);
            let result = scanner._retry(device);
            expect(typeof(result)).to.be.equal('function');
            expect(scanner._queue.length).to.be.equal(0);
            result(0,true);
            expect(scanner._queue.length).to.be.equal(1);
            sandbox.assert.calledOnce(console.log);
        });

        
    });


    describe('_processDevices', () => {
        let client;
        let scanner;
        beforeEach(()=>{
            client = {
                on: sandbox.spy(),
                subscribe: sandbox.spy(),
            };
            sandbox.useFakeTimers();
            sandbox.stub(Mqtt, "connect").returns(client);
            scanner = new BluetoothScanner({"searchDelaySec": 60, knownDevices : [{mac: "00:20:18:61:f1:8a", name: "testName"}]});
        });

        afterEach(()=>{
            sandbox.restore();
        });
        
        
        it('should add devices to queue if already running', async () => {
            expect(scanner._queue.length).to.be.equal(0);
            scanner._isRuning = true;
            sandbox.stub(console, 'log');
            await scanner._processDevices();
            sandbox.assert.calledTwice(console.log);
            expect(scanner._queue.length).to.be.equal(1);
        });

        it('should add devices to queue and start scanning', async () => {
            expect(scanner._queue.length).to.be.equal(0);
            scanner._isRuning = false;
            sandbox.stub(console, 'log');
            sandbox.stub(Hcitool, 'searchForDevice').returns({toString: ()=>{"found"}});

            await scanner._processDevices();
            sandbox.assert.calledTwice(console.log);
            scanner._devices[0]
            expect(scanner._timer).is.not.undefined;
            expect(scanner._timer).is.not.equal(0);
            clearTimeout(scanner._timer);
            expect(scanner._isRuning).to.be.false;
            expect(scanner._queue.length).to.be.equal(0);
            sandbox.assert.calledTwice(console.log);
        });



        it('should scan again after searchDelaySec', async () => {

            expect(scanner._queue.length).to.be.equal(0);
            scanner._isRuning = false;
            sandbox.stub(console, 'log');
            sandbox.stub(scanner, '_searchForDevice').returns(true);
            sandbox.stub(scanner, '_retry');
            scanner._devices[0]._confidenceObservers = [];
            expect(scanner._devices[0].confidence).to.be.equal(0);
            
            await scanner._processDevices();
            
            expect(scanner._timer).is.not.undefined;
            expect(scanner._timer).is.not.equal(0);
            expect(scanner._isRuning).to.be.false;
            expect(scanner._queue.length).to.be.equal(0);
            sandbox.assert.calledTwice(console.log);
            sandbox.assert.calledOnce(scanner._searchForDevice);

            sandbox.stub(scanner, '_processDevices');
            
            sandbox.clock.tick(scanner._settings.searchDelaySec*1000+100);

            
            sandbox.assert.calledOnce(scanner._processDevices);
            
            clearTimeout(scanner._timer);
        });

    });
});