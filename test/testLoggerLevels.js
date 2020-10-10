const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);
const Levels = require('../LoggerLevels.js');


describe('Test LoggerLevels', () => {
    describe('Test getters', () => {
        it('should have correct levels', () => {
            expect(Levels.debug).to.be.equal(0);
            expect(Levels.info).to.be.equal(1);
            expect(Levels.warning).to.be.equal(2);
            expect(Levels.error).to.be.equal(3);
        });
    });
});

