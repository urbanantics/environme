const glob = require("glob")
const fs = require('fs')
const yaml = require('js-yaml');

/**
 * Environ Me, Accepts a listo of files as input and converts content based on configuration.
 * Files names must have the format *.template{.ext}
 * For instance app.template.config, the function will match config files called app.props.yml, and use the contents
 * to create a new file called app.config 
 * @param path
 * path patterns to match 
 * https://github.com/isaacs/node-glob
 * @param targetEnvironment
 * String, target environment
 */
function environMe(
    path,
    targetEnvironment,
    verboseLogs
  ) {
  
    try {
  
      // https://github.com/isaacs/node-glob
  
      const files = glob.sync(path);
  
      var templates = [];
  
      files.forEach(function (file) {
        if (file.match(/\.template/)) {
          console.log(`Matched template ${file}`);
  
          const temp = file.replace(/\.template.*/, '');
          const ext = file.replace(/.*\.template/, '');
          const propsFile = `${temp}.props.yml`;
          const outputFile = `${temp}${ext}`;
  
          if (fs.existsSync(propsFile)) {
            console.log(`Matched props file ${propsFile}`);
            console.log(`Output file ${outputFile}`);
  
            templates.push({
              file: file,
              propsFile: propsFile,
              outputFile: outputFile
            });
  
          }
        }
      });
  
      if(verboseLogs){
        console.log("List of template files to be environed");
        console.log(templates);
      }
      
      for (let index = 0; index < templates.length; index++) {
        const template = templates[index];
        const rawTemplate = fs.readFileSync(template.file, 'utf8');
        const propsObj = yaml.safeLoad(fs.readFileSync(template.propsFile, 'utf8'));
  
        if(verboseLogs){
            console.log("*** input yml config ***");
            console.log(propsObj);
        }
        
        const outputString = convertStringTemplate(rawTemplate, propsObj, targetEnvironment, verboseLogs);
  
        fs.writeFileSync(template.outputFile, outputString, 'utf8');
      }
  
    } catch (err) {
      console.error(err)
    }
  
  
  }
  
  
  /**
   * Convert String Template. Replaces string tokens with values from json object
   * @param stringTemplate
   * String template which contains tokens that will be replaced with values from envObj (json object) provided
   * @param flatObj
   * json object, whos values will be replaced into provided string template
   * @returns {string}
   * Converted string template
   */
  function convertStringTemplate(
    stringTemplate,
    flatObj,
    targetEnvironment,
    verboseLogs
  ) {
  
    var returnString = stringTemplate;
    var result = {};
  
    const envObj = flattenObject(flatObj, targetEnvironment)

    if(verboseLogs){
        console.log("*** flattened yml config ***");
        console.log(flatObj);
    }
  
    // https://stackoverflow.com/questions/11592033/regex-match-text-between-tags
    stringTemplate.match(/{\$(.*?)\$}/g).forEach(function (rawTag) {
      var tag = rawTag.replace(/(^{\$\s*)|(\s*\$})$/g, '');
      var value = Object.byString(envObj, tag);
  
      if (value && value !== Object(value)) {
  
        result[rawTag] = value;
      }
  
    });
  
    for (const key in result) {
  
      returnString = returnString.replace(key, result[key])
    }
  
    return returnString;
  }
  
  /**
   * Flatten Object.
   * @param source
   * json object containing configuration that will be flattened
   * @param targetEnvironment
   * environment who configs will override default config
   * @param environmentList
   * list of all the environments contained in the config
   * @returns {object}
   * Flattened json object
   */
  function flattenObject(
    sourceObj,
    targetEnvironment) {
  
    for (const key in sourceObj) {
  
      var target = sourceObj[key];
  
      if (isObject(target)) {
  
        flattenObject(target, targetEnvironment);
  
      }
  
      if (key == targetEnvironment) {

        const envProp = sourceObj[key];
  
        delete sourceObj[key];
  
        sourceObj = mergeDeep(sourceObj, envProp)
      }
  
    }
  
    return sourceObj
  }
  
  
  /**
   * Simple object check.
   * @param item
   * @returns {boolean}
   */
  function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
  
  
  /**
   * Deep merge two objects.
   * https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
   * @param target
   * @param ...sources
   */
  function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
  
    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
  
    return mergeDeep(target, ...sources);
  }
  
  
  /**
   * https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
   */
  Object.byString = function (o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
      var k = a[i];
      if (k in o) {
        o = o[k];
      } else {
        return;
      }
    }
    return o;
  }
  
  module.exports = {
    environMe: environMe,
    convertStringTemplate: convertStringTemplate,
    mergeDeep: mergeDeep,
    flattenObject: flattenObject
  }