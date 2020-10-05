const chai = require('chai');
const expect = chai.expect;
const Device = require("../Device.js");
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
const BluetoothScanner = require('../BluetoothScanner.js');
const Mqtt = require("async-mqtt");
const sandbox = require('sinon').createSandbox();
chai.should();
chai.use(sinonChai);


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



        it("Should use some defaults when not specified in settings",()=>{
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
            scanner.addDevice(device);
            await scanner.listenForMessages();
            sandbox.assert.calledOnce(Mqtt.connect);
            sandbox.assert.calledWith(Mqtt.connect, "tcp://127.0.0.1:18833", {"username": "username", "password": "password"});
            sandbox.assert.calledOnce(client.subscribe);
            expect(client.subscribe.args[0][0]).to.be.equal('presence/scan');

            sandbox.assert.calledOnce(client.on);
            expect(client.on.args[0][0]).to.be.equal('message');

            sandbox.stub(scanner, "_processDevices");

            let topic = {toString : ()=>{return "presence/scan"}};
            let message = {toString : ()=> {return JSON.stringify({'addresses':['123']})}};
            client.on.args[0][1](topic, message);
            sandbox.assert.calledOnce(scanner._processDevices);
            sandbox.assert.calledWith(scanner._processDevices, [device]);            
        });

        it("should process only specific added devices", async ()=>{
            let scanner = new BluetoothScanner({});
            let device = new Device({'name':"hello", 'mac':'123'});
            scanner.addDevice(device);
            await scanner.listenForMessages();
            sandbox.assert.calledOnce(Mqtt.connect);
            sandbox.assert.calledWith(Mqtt.connect, "tcp://127.0.0.1:18833", {"username": "username", "password": "password"});
            sandbox.assert.calledOnce(client.subscribe);
            expect(client.subscribe.args[0][0]).to.be.equal('presence/scan');

            sandbox.assert.calledOnce(client.on);
            expect(client.on.args[0][0]).to.be.equal('message');

            sandbox.stub(scanner, "_processDevices");

            let topic = {toString : ()=>{return "presence/scan"}};
            let message = {toString : ()=> {return JSON.stringify({'addresses':['123', '1234']})}};
            client.on.args[0][1](topic, message);
            sandbox.assert.calledOnce(scanner._processDevices);
            sandbox.assert.calledWith(scanner._processDevices, [device]);            
        });

        it("should process none if not added", async ()=>{
            let scanner = new BluetoothScanner({});
            let device = new Device({'name':"hello", 'mac':'123'});
            scanner.addDevice(device);
            await scanner.listenForMessages();
            sandbox.assert.calledOnce(Mqtt.connect);
            sandbox.assert.calledWith(Mqtt.connect, "tcp://127.0.0.1:18833", {"username": "username", "password": "password"});
            sandbox.assert.calledOnce(client.subscribe);
            expect(client.subscribe.args[0][0]).to.be.equal('presence/scan');

            sandbox.assert.calledOnce(client.on);
            expect(client.on.args[0][0]).to.be.equal('message');

            sandbox.stub(scanner, "_processDevices");

            let topic = {toString : ()=>{return "presence/scan"}};
            let message = {toString : ()=> {return JSON.stringify({'addresses':['1234']})}};
            client.on.args[0][1](topic, message);
            sandbox.assert.calledOnce(scanner._processDevices);
            sandbox.assert.calledWith(scanner._processDevices, []);            
        });

        it("should process none if not added2", async ()=>{
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
            let message = {toString : ()=> {return JSON.stringify({'addresses':[]})}};
            client.on.args[0][1](topic, message);
            sandbox.assert.calledOnce(scanner._processDevices);
            sandbox.assert.calledWith(scanner._processDevices, []);            
        });
    });
});