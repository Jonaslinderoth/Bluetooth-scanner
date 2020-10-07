const chai = require('chai');
const expect = chai.expect;
const Device = require("../Device.js");
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);
const BluetoothScanner = require('../BluetoothScanner.js');
const Mqtt = require("async-mqtt");
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

});