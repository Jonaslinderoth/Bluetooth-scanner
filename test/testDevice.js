const chai = require('chai');
const expect = chai.expect;
const Device = require("../Device.js");
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);

describe('Test Device', function () {
  describe('Constructor', function () {
    it('should return error when empty argument', function () {
        expect(()=>{new Device({})}).to.throw("Mac address is not defined"); 
    });
    it('should return error when no name', function () {
        expect(()=>{new Device({mac: "00:20:18:61:f1:8a"})}).to.throw("Name not defined"); 
    });

    it("should have set confidence and present correctly", function(){
        let device = new Device({mac: "00:20:18:61:f1:8a", name: "testName"});
        expect(device._confidence).to.equal(0);
        expect(device._present).to.be.false;
    })

    it("should have set confidence and present correctly according to settings", function(){
        let device = new Device({mac: "00:20:18:61:f1:8a", name: "testName", confidence:100});
        expect(device._confidence).to.equal(100);
        expect(device._present).to.be.true;
    })

    it("should have confidence less leq 100", function(){
        let device = new Device({mac: "00:20:18:61:f1:8a", name: "testName", confidence:1000});
        expect(device._confidence).to.equal(100);
        expect(device._present).to.be.true;
    })
    it("should have confidence less geq 0", function(){
        let device = new Device({mac: "00:20:18:61:f1:8a", name: "testName", confidence:-1000});
        expect(device._confidence).to.equal(0);
        expect(device._present).to.be.false;
        expect(device.confidence).to.equal(0);
        expect(device.present).to.be.false;
    })
  });
  
  describe('set/get/subscribe/notify confidence', () => {
      it("should change the value", () => {
        let device = new Device({mac: "00:20:18:61:f1:8a", name: "testName"});
        expect(device.confidence).to.equal(0);
        expect(device.present).to.be.false;
        device.confidence = 100;
        expect(device.confidence).to.equal(100);
        expect(device.present).to.be.true;
      });
      it("should be in [0;100]", () => {
        let device = new Device({mac: "00:20:18:61:f1:8a", name: "testName"});
        expect(device.confidence).to.equal(0);
        expect(device.present).to.be.false;
        device.confidence = 100000;
        expect(device.confidence).to.equal(100);
        expect(device.present).to.be.true;
        device.confidence = -100000;
        expect(device.confidence).to.equal(0);
        expect(device.present).to.be.false;
      });
      
      it("should notify when change", () => {
        let device = new Device({mac: "00:20:18:61:f1:8a", name: "testName"});

        expect(device.confidence).to.equal(0);
        expect(device.present).to.be.false;
        let confidenceSpy = sinon.spy();
        let presentSpy = sinon.spy();

        device.subscribeConfidence(confidenceSpy)
        device.subscribePresent(presentSpy)
        device.confidence = 100000;
        expect(device.confidence).to.equal(100);
        expect(device.present).to.be.true;
        expect(confidenceSpy).to.have.been.calledOnceWith(100,true);
        expect(presentSpy).to.have.been.calledOnceWith(true);
      });

      it("should not notify when same value", () => {
        let device = new Device({mac: "00:20:18:61:f1:8a", name: "testName"});
        let count = 0;
        expect(device.confidence).to.equal(0);
        expect(device.present).to.be.false;
        device.confidence = 100;
        let confidenceSpy = sinon.spy();
        let presentSpy = sinon.spy();

        device.subscribeConfidence(confidenceSpy)
        device.subscribePresent(presentSpy)

        device.confidence = 100;
        expect(device.confidence).to.equal(100);
        expect(device.present).to.be.true;
        expect(confidenceSpy).to.have.been.callCount(0);
        expect(presentSpy).to.have.been.callCount(0);
      });

      it("should not notify when too high", () => {
        let device = new Device({mac: "00:20:18:61:f1:8a", name: "testName"});
        let count = 0;
        expect(device.confidence).to.equal(0);
        expect(device.present).to.be.false;
        device.confidence = 100;

        let confidenceSpy = sinon.spy();
        let presentSpy = sinon.spy();

        device.subscribeConfidence(confidenceSpy)
        device.subscribePresent(presentSpy)

        device.confidence = 100000;
        expect(device.confidence).to.equal(100);
        expect(device.present).to.be.true;
        expect(confidenceSpy).to.have.been.callCount(0);
        expect(presentSpy).to.have.been.callCount(0);

      });

      it("should not notify when too low", () => {
        let device = new Device({mac: "00:20:18:61:f1:8a", name: "testName"});
        let count = 0;
        expect(device.confidence).to.equal(0);
        expect(device.present).to.be.false;
        device.confidence = 0;

        let confidenceSpy = sinon.spy();
        let presentSpy = sinon.spy();

        device.subscribeConfidence(confidenceSpy)
        device.subscribePresent(presentSpy)

        device.confidence = -100000;
        expect(device.confidence).to.equal(0);
        expect(device.present).to.be.false;
        expect(confidenceSpy).to.have.been.callCount(0);
        expect(presentSpy).to.have.been.callCount(0);

      });

  });

});