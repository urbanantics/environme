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

    const outputObj = test.flattenObject(sourceObj, targetEnvironment)
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

    const outputObj = test.flattenObject(sourceObj, targetEnvironment)
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

    const outputObj = test.flattenObject(sourceObj, targetEnvironment)
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

    const outputObj = test.flattenObject(sourceObj, targetEnvironment)
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

    const outputObj = test.flattenObject(sourceObj, targetEnvironment)
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
    const expectedString = `<!DOCTYPE html><html><body><div>Hello World!</div></body></html>`

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

  it('Test convert basic string with environment object', function () {

    const stringTemplate = `<!DOCTYPE html><html><body>{$ my_content $}</body></html>`;
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

    const propsContent = `config:
    url: https://www.petguide.com/wp-content/uploads/2013/05/pitbull.jpg`;

    fs.writeFileSync("test/test.template.html", templateContent, 'utf8')
    fs.writeFileSync("test/test.props.yml", propsContent, 'utf8')
    
    // Act
    test.environMe("test/*", "PROD")

    // Assert
    const fileExists = fs.existsSync("test/test.html")
    const actualContent = fs.readFileSync("test/test.html", 'utf8')

    assert.equal(fileExists, true);
    assert.equal(expectedContent, actualContent);

    // Tidy
    fs.unlinkSync("test/test.html")
    fs.unlinkSync("test/test.template.html")
    fs.unlinkSync("test/test.props.yml")


  });
});

