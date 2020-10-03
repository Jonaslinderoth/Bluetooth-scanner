const chai = require('chai');
const expect = chai.expect;
const Device = require("../BluetoothScanner.js");
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
const BluetoothScanner = require('../BluetoothScanner.js');
const Mqtt = require("async-mqtt");
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
});