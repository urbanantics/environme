var assert = require('assert');
var test = require('../src/index');

/************************* Merge Deep *******************************/
describe('Merge Deep', function() {
  it('Test Deep Copy', function() {

    var sourceObj = { a: 1 };
    var targetObj = { b : { c: { d: { e: { f: 12345}}}}};

    const merged = test.mergeDeep(sourceObj, targetObj)
    console.log(merged.b.c);
    assert.equal(merged.b.c.d.e.f, 12345);
  });

  it('Test Overwrite', function() {

    var sourceObj = { a: 1 };
    var targetObj = { a : 2};

    const merged = test.mergeDeep(sourceObj, targetObj)
    assert.equal(merged.a, 2);
  });

  it('Test Array Overwrite', function() {

    var arrayRes = [1, 2, 3, 5];
    var sourceObj = {a: [1, 1, 1, 1]};
    var targetObj = { a : [1, 2, 3, 5]};

    const merged = test.mergeDeep(sourceObj, targetObj);
    assert.equal(JSON.stringify(merged.a), JSON.stringify(arrayRes));
  });
});


/************************* Flatten Object *******************************/
describe('Flatten Object', function() {
  it('Test Object with no environments', function() {

    const sourceObj = {
      connectionString: "TestDB1"
    }

    const targetEnvironment = "TEST"
    const environmentList = ["TEST", "PROD"]

    const outputObj = test.flattenObject(sourceObj, targetEnvironment, environmentList)
    assert.equal(sourceObj, outputObj);
    assert.equal(sourceObj["connectionString"], "TestDB1")
  });

  it('Test Basic Environment override', function() {

    const sourceObj = {
      TEST: {
        connectionString: "TestDB1"
      },
      connectionString: "ProdDB1"
    }

    const targetEnvironment = "TEST"
    const environmentList = ["TEST", "PROD"]

    const outputObj = test.flattenObject(sourceObj, targetEnvironment, environmentList)
    assert.equal(sourceObj, outputObj);
    assert.equal(sourceObj["connectionString"], "TestDB1")
  });

  it('Test Double Environment override', function() {

    const sourceObj = {
      TEST: {
        TEST: {
          connectionString: "TestDB1"
        }
      },
      connectionString: "ProdDB1"
    }

    const targetEnvironment = "TEST"
    const environmentList = ["TEST", "PROD"]

    const outputObj = test.flattenObject(sourceObj, targetEnvironment, environmentList)
    assert.equal(sourceObj, outputObj);
    assert.equal(sourceObj["connectionString"], "TestDB1")
  });

  it('Test Multiple Environment override', function() {

    const sourceObj = {
      TEST: {
        connectionString: "TestDB1"
      },
      PROD2: {
        connectionString: "ProdDB2"
      },
      connectionString: "ProdDB1"
    }

    const targetEnvironment = "TEST"
    const environmentList = ["TEST", "PROD"]

    const outputObj = test.flattenObject(sourceObj, targetEnvironment, environmentList)
    assert.equal(sourceObj, outputObj);
    assert.equal(sourceObj["connectionString"], "TestDB1")
  });

  it('Test array override', function() {

    const sourceObj = {
      DR: {
        machineList: ["app1", "app2", "app3", "app4"]
      },
      PROD: {
        machineList: ["pr-app1", "pr-app2", "pr-app3", "pr-app4"]
      },
      machineList: ["app1", "app2", "app3", "app4"]
    }

    var arrayRes = ["pr-app1", "pr-app2", "pr-app3", "pr-app4"];

    const targetEnvironment = "PROD"
    const environmentList = ["DR", "PROD"]

    const outputObj = test.flattenObject(sourceObj, targetEnvironment, environmentList)
    assert.equal(JSON.stringify(outputObj.machineList), JSON.stringify(arrayRes));
  });
});