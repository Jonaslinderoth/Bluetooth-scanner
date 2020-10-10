const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);
const Levels = require('../LoggerLevels.js');
const Logger = require('../Logger.js');


describe('Test LoggerLevels', () => {
    describe('Test Constructor', () => {
        it('should set default levels', () => {
            let logger = new Logger();
            expect(logger._level).to.be.equal(Levels.debug);
        });

        it('Should accept new logger level', () => {
            let logger = new Logger(Levels.warning);
            expect(logger._level).to.be.equal(Levels.warning);
        });
    });
    
    describe('Test info level', () => {
        it('should call console.log when level info', () => {
            let stub = sinon.stub(console, 'log');
            let logger = new Logger(Levels.info);
            expect(logger._level).to.be.equal(Levels.info);
            logger.info("hello world");
            expect(stub.calledOnce).to.be.true;
            expect(stub.calledOnceWith("hello world")).to.be.true;
        });
        
    });
});

