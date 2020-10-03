const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');


describe('Setup', function () {
  describe('2+2', function () {
    it('2+2 should be 4', function () {
        expect(2+2).to.equal(4);
        assert.equal(2+2,4);
    });
    
    it('2+2 should not be 5', function () {
      expect(2+2).to.not.equal(5);
    });

  });
});