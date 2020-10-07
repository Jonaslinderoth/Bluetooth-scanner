const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);
const Hcitool = require('../Hcitool.js');


describe('Test Hcitool', () => {
    describe('Search for device', () => {
        it('should invoke spawn', () => {
            let stub = sinon.stub(Hcitool, 'searchForDevice');
            Hcitool.searchForDevice("1234");            
            expect(stub.calledOnce).to.be.true;
            expect(stub.calledOnceWith("1234")).to.be.true;
            stub.restore();
        });


        it('should return value', async () => {
            let stub = sinon.stub(Hcitool, 'searchForDevice').resolves("Found");
            let value = await Hcitool.searchForDevice("1234");            
            expect(value).to.be.equal("Found");
            expect(stub.calledOnce).to.be.true;
            expect(stub.calledOnceWith("1234")).to.be.true;

            stub.restore();
        });
    });
    
});

