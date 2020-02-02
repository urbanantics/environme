var assert = require('assert');
var test = require('../src/index');
describe('Hello World', function() {
  it('should return Hello World', function() {
    assert.equal(test.helloWorld(), 'Hello World!');
  });
});