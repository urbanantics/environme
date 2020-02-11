const assert = require('assert');
const test = require('../src/environme');
const fs = require('fs')

/************************* Merge Deep *******************************/
describe('Merge Deep', function () {
  it('Test Deep Copy', function () {

    var sourceObj = { a: 1 };
    var targetObj = { b: { c: { d: { e: { f: 12345 } } } } };

    const merged = test.mergeDeep(sourceObj, targetObj)
    console.log(merged.b.c);
    assert.equal(merged.b.c.d.e.f, 12345);
  });

  it('Test Overwrite', function () {

    var sourceObj = { a: 1 };
    var targetObj = { a: 2 };

    const merged = test.mergeDeep(sourceObj, targetObj)
    assert.equal(merged.a, 2);
  });

  it('Test Array Overwrite', function () {

    var arrayRes = [1, 2, 3, 5];
    var sourceObj = { a: [1, 1, 1, 1] };
    var targetObj = { a: [1, 2, 3, 5] };

    const merged = test.mergeDeep(sourceObj, targetObj);
    assert.equal(JSON.stringify(merged.a), JSON.stringify(arrayRes));
  });
});


/************************* Flatten Object *******************************/
describe('Flatten Object', function () {
  it('Test Object with no environments', function () {

    const sourceObj = {
      connectionString: "TestDB1"
    }

    const targetEnvironment = "TEST"

    const outputObj = test.deEnvObject(sourceObj, targetEnvironment)
    assert.equal(sourceObj, outputObj);
    assert.equal(sourceObj["connectionString"], "TestDB1")
  });

  it('Test Basic Environment override', function () {

    const sourceObj = {
      TEST: {
        connectionString: "TestDB1"
      },
      connectionString: "ProdDB1"
    }

    const targetEnvironment = "TEST"

    const outputObj = test.deEnvObject(sourceObj, targetEnvironment)
    assert.equal(sourceObj, outputObj);
    assert.equal(sourceObj["connectionString"], "TestDB1")
  });

  it('Test Double Environment override', function () {

    const sourceObj = {
      TEST: {
        TEST: {
          connectionString: "TestDB1"
        }
      },
      connectionString: "ProdDB1"
    }

    const targetEnvironment = "TEST"

    const outputObj = test.deEnvObject(sourceObj, targetEnvironment)
    assert.equal(sourceObj, outputObj);
    assert.equal(sourceObj["connectionString"], "TestDB1")
  });

  it('Test Multiple Environment override', function () {

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

    const outputObj = test.deEnvObject(sourceObj, targetEnvironment)
    assert.equal(sourceObj, outputObj);
    assert.equal(sourceObj["connectionString"], "TestDB1")
  });

  it('Test array override', function () {

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

    const outputObj = test.deEnvObject(sourceObj, targetEnvironment)
    assert.equal(JSON.stringify(outputObj.machineList), JSON.stringify(arrayRes));
  });
});

/************************* Convert String Template *******************************/
describe('Convert String Template', function () {
  it('Test convert basic string with basic object', function () {

    const stringTemplate = `<!DOCTYPE html><html><body>{$my_content$}</body></html>`;
    const envObj = {
      my_content: "<div>Hello World!</div>"
    };
    const expectedString = `<!DOCTYPE html><html><body><div>Hello World!</div></body></html>`;

    const outputString = test.convertStringTemplate(stringTemplate, envObj)
    assert.equal(outputString, expectedString);
  });

  it('Test Nested object is not string should be ignored 1', function () {

    const stringTemplate = `<!DOCTYPE html><html><body>{$my_content$}</body></html>`;
    const envObj = {
      my_content: {
        my_content: "<div>Hello World!</div>"
      }
    };
    const expectedString = `<!DOCTYPE html><html><body>{$my_content$}</body></html>`

    const outputString = test.convertStringTemplate(stringTemplate, envObj)
    assert.equal(outputString, expectedString);
  });

  it('Test Nested object is not string should be ignored 2', function () {

    const stringTemplate = `<!DOCTYPE html><html><body>{$my_content$}</body></html>`;
    const envObj = {
      my_content: {
        my_content: null
      }
    };
    const expectedString = `<!DOCTYPE html><html><body>{$my_content$}</body></html>`

    const outputString = test.convertStringTemplate(stringTemplate, envObj)
    assert.equal(outputString, expectedString);
  });

  it('Test Nested object 3', function () {

    const stringTemplate = `<!DOCTYPE html><html><body><a href="{$  my.content.url  $}"></a></body></html>`;
    const envObj = {
      my: {
        content: {
          url: "http://yolo.com"
        }
      }
    };
    const expectedString = `<!DOCTYPE html><html><body><a href="http://yolo.com"></a></body></html>`

    const outputString = test.convertStringTemplate(stringTemplate, envObj)
    assert.equal(outputString, expectedString);
  });
});

/************************* Environme *******************************/
describe('Run environMe command to convert text files based on environment config', function () {
  it('Test basic environMe command', function () {

    // Arrange
    const templateContent = `<!DOCTYPE html>
    <html>
        <body>
            <div>
                <img src="{$ config.url $}"/>
            </div>
        </body>
    </html>`;

    const expectedContent = `<!DOCTYPE html>
    <html>
        <body>
            <div>
                <img src="https://www.petguide.com/wp-content/uploads/2013/05/pitbull.jpg"/>
            </div>
        </body>
    </html>`;

    const expectedResObj = {
      "config.url" : "https://www.petguide.com/wp-content/uploads/2013/05/pitbull.jpg"
    };

    const propsContent = `config:
    url: https://www.petguide.com/wp-content/uploads/2013/02/dalmatian-11-475x421.jpg
    PROD:
        url: https://www.petguide.com/wp-content/uploads/2013/05/pitbull.jpg`;

    fs.writeFileSync("test/test.template.html", templateContent, 'utf8')
    fs.writeFileSync("test/test.props.yml", propsContent, 'utf8')

    fs.writeFileSync("test/test2.template.html", templateContent, 'utf8')
    fs.writeFileSync("test/test2.props.yml", propsContent, 'utf8')
    
    // Act
    var resObj = test.environMe("test/*", "PROD")

    // Assert
    const fileExists = fs.existsSync("test/test.html")
    const fileExists2 = fs.existsSync("test/test2.html")
    const actualContent = fs.readFileSync("test/test.html", 'utf8')

    assert.equal(fileExists, true);
    assert.equal(fileExists2, true);
    assert.equal(expectedContent, actualContent);
    assert.equal(JSON.stringify(resObj), JSON.stringify(expectedResObj));

    // Tidy
    fs.unlinkSync("test/test.html")
    fs.unlinkSync("test/test.template.html")
    fs.unlinkSync("test/test.props.yml")

    fs.unlinkSync("test/test2.html")
    fs.unlinkSync("test/test2.template.html")
    fs.unlinkSync("test/test2.props.yml")
  });
});

/************************* Convert String Template *******************************/
describe('Replace Environment Variable References', function () {
  it('Replace Environment Variable References', function () {

    const flatObj = {
      seceret: "{$ seceretKey $}"
    };

    const envObj = {
      seceretKey: "1234"
    };
    const expectedObj = {
      seceret: "1234"
    };

    test.resolveVariableReferences(flatObj, envObj)

    assert.equal(JSON.stringify(flatObj), JSON.stringify(expectedObj));
  });
});

/************************* Flatten Object *******************************/
describe('Flatten Object', function () {
  it('Basic Flatten Object', function () {

    const sourceObj = {
      a: {
        b: {
          c: "my_value"
        }
      }
    };

    const expectedObj = {
      "a.b.c": "my_value"
    };

    const flatObj = test.flattenObj(sourceObj)

    assert.equal(JSON.stringify(flatObj), JSON.stringify(expectedObj));
  });
});

/************************* Map Branches *******************************/
describe('Test mapBranches', function () {
  it('Basic mapBranches Object', function () {

    const branchMapping = "develop=DEV,feature/=TEST,master=PROD";

    const currentBranch = "refs/heads/master";

    const environment = test.mapBranches(branchMapping, currentBranch)

    assert.equal(environment, "PROD");
  });
  it('Basic mapBranches Object 2', function () {

    const branchMapping = "develop=DEV,feature/=TEST,master=PROD";

    const currentBranch = "refs/heads/feature/my-feature";

    const environment = test.mapBranches(branchMapping, currentBranch)

    assert.equal(environment, "TEST");
  });
  it('Basic mapBranches missing mapping', function () {

    const branchMapping = "develop=DEV,feature/=TEST,master=PROD";

    const currentBranch = "refs/heads/release/my-feature";

    const environment = test.mapBranches(branchMapping, currentBranch)

    assert.equal(environment, "");
  });
  it('Basic mapBranches malformed mapping', function () {

    const branchMapping = "develop=DEV=TEST,feature/=TEST,master=PROD";

    const currentBranch = "refs/heads/develop";

    const environment = test.mapBranches(branchMapping, currentBranch)

    assert.equal(environment, "");
  });
  it('Test mapBranches null', function () {

    const branchMapping = null;

    const currentBranch = "refs/heads/develop";

    const environment = test.mapBranches(branchMapping, currentBranch)

    assert.equal(environment, "");
  });
});



