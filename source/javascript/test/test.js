var assert = require('assert');
var test = require('../src/index');

describe('Merge Deep', function() {
  it('Test Deep Copy', function() {
    const merged = test.mergeDeep({a: 1}, { b : { c: { d: { e: { f: 12345}}}}})
    console.log(merged.b.c);
    assert.equal(merged.b.c.d.e.f, 12345);
  });

  it('Test Overwrite', function() {
    const merged = test.mergeDeep({a: 1}, { a : 2})
    assert.equal(merged.a, 2);
  });

  it('Test Array Overwrite', function() {

    var arrayRes = [1, 2, 3, 5];

    const merged = test.mergeDeep({a: [1, 1, 1, 1]}, { a : [1, 2, 3, 5]})
    assert.equal(JSON.stringify(merged.a), JSON.stringify(arrayRes));
  });
});