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
  targetEnvironment,
  environmentList) {

    for (const key in sourceObj) {

      var target = sourceObj[key];

      if (isObject(target)) {

        console.log(`Key ${key} is object, recursing`);

        var flattendObj = flattenObject(target, targetEnvironment, environmentList);

      } else {

        console.log(`Key ${key} = ${targetEnvironment}`);

        var flattendObj = target;
      
      }

      if(key == targetEnvironment){

        console.log(`Merging and removing Env key ${key}`);

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

module.exports = {
  mergeDeep: mergeDeep,
  flattenObject: flattenObject
}