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

    const outputObj = test.flattenObject(sourceObj, targetEnvironment)
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

    const outputObj = test.flattenObject(sourceObj, targetEnvironment)
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

    const outputObj = test.flattenObject(sourceObj, targetEnvironment)
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

    const outputObj = test.flattenObject(sourceObj, targetEnvironment)
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

    const outputObj = test.flattenObject(sourceObj, targetEnvironment)
    assert.equal(JSON.stringify(outputObj.machineList), JSON.stringify(arrayRes));
  });
});

/************************* Convert String Template *******************************/
describe('Convert String Template', function() {
  it('Test convert basic string with basic object', function() {

    const stringTemplate = `<!DOCTYPE html><html><body><$my_content$></body></html>`;
    const envObj = {
      my_content: "<div>Hello World!</div>"
    };
    const expectedString = `<!DOCTYPE html><html><body><div>Hello World!</div></body></html>`

    const outputString = test.convertStringTemplate(stringTemplate, envObj)
    assert.equal(outputString, expectedString);
  });

  it('Test Nested object is not string should be ignored 1', function() {

    const stringTemplate = `<!DOCTYPE html><html><body><$my_content$></body></html>`;
    const envObj = {
      my_content: {
        my_content: "<div>Hello World!</div>"
      }
    };
    const expectedString = `<!DOCTYPE html><html><body><$my_content$></body></html>`

    const outputString = test.convertStringTemplate(stringTemplate, envObj)
    assert.equal(outputString, expectedString);
  });

  it('Test Nested object is not string should be ignored 2', function() {

    const stringTemplate = `<!DOCTYPE html><html><body><$my_content$></body></html>`;
    const envObj = {
      my_content: {
        my_content: null
      }
    };
    const expectedString = `<!DOCTYPE html><html><body><$my_content$></body></html>`

    const outputString = test.convertStringTemplate(stringTemplate, envObj)
    assert.equal(outputString, expectedString);
  });

  it('Test convert basic string with environment object', function() {

    const stringTemplate = `<!DOCTYPE html><html><body><$my_content$></body></html>`;
    const envObj = {
      my_content: "<div>Hello World!</div>",
      PROD: {
        my_content: "<div>## Production content ##</div>"
      }
    
    };
    const expectedString = `<!DOCTYPE html><html><body><div>## Production content ##</div></body></html>`

    const outputString = test.convertStringTemplate(stringTemplate, envObj, "PROD")
    assert.equal(outputString, expectedString);
  });
});

