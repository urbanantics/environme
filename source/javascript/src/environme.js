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

        var returnObj = {};

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

        if (verboseLogs) {
            console.log("List of template files to be environed");
            console.log(templates);
        }

        for (let index = 0; index < templates.length; index++) {
            const template = templates[index];
            const rawTemplate = fs.readFileSync(template.file, 'utf8');
            const propsObj = yaml.safeLoad(fs.readFileSync(template.propsFile, 'utf8'));

            if (verboseLogs) {
                console.log("*** input yml config ***");
                console.log(propsObj);
            }

            const noEnvObj = deEnvObject(propsObj, targetEnvironment)

            if (verboseLogs) {
                console.log("*** flattened yml config ***");
                console.log(noEnvObj);
            }

            const outputString = convertStringTemplate(rawTemplate, noEnvObj);

            fs.writeFileSync(template.outputFile, outputString, 'utf8');

            returnObj = mergeDeep(noEnvObj, returnObj);
        }

        return flattenObj(returnObj);

    } catch (err) {
        console.error(err)
    }
}

/**
 * flatten nested object into string hash
 * @param branchesStr
 * Object representing branch mapping
 * @param currentBranch
 * Branch name to match branches object against
 * @returns [String ] Target Environment or else empty string
 */
function mapBranches(
    branchesStr, 
    currentBranch,
    verboseLogs) {

    const branches = (branchesStr || "").split(",");

    if(verboseLogs){
        console.log(`branchesStr ${branchesStr}`);
        console.log(`currentBranch ${currentBranch}`);
        console.log("branches:");
        console.log(branches);
    }
    

    for (let index = 0; index < branches.length; index++) {
        const branch = branches[index]

        const branchSplit = branch.split('=');

        if(branchSplit.length != 2){
            continue;
        }
        if(currentBranch.includes(branchSplit[0])){
            return branchSplit[1];
        }
    }

    return "";

}


/**
 * flatten nested object into string hash
 * @param sourceObj
 * Object to be flattened
 * @returns flattened object
 */
function flattenObj(sourceObj, keyIn) {

    var resObj = {};

    for (const key in sourceObj) {

        var target = sourceObj[key];

        if (isObject(target)) {

            if(keyIn) {
                const flatObj = flattenObj(target, `${keyIn}.${key}`);

                resObj = mergeDeep(flatObj, resObj);
            } else {
                const flatObj = flattenObj(target, `${key}`);

                resObj = mergeDeep(flatObj, resObj);
            }
        } else {

            resObj[`${keyIn}.${key}`] = target;
        }
    }

    return resObj;
}

/**
 * Simple object check.
 * @param sourceObj
 * Object that contains references to environment variables in the for of {$ variable_name $}
 * @param envObj
 * object that contains hash of environment variable key value pairs
 * @returns updates sourceObj inline
 */
function resolveVariableReferences(sourceObj, envObj) {

    for (const key in sourceObj) {

        var target = sourceObj[key];

        if (isObject(target)) {

            resolveVariableReferences(target, envObj);

        } else {

            // https://stackoverflow.com/questions/11592033/regex-match-text-between-tags
            target.match(/{\$(.*?)\$}/g).forEach(function (rawTag) {
                var tag = rawTag.replace(/(^{\$\s*)|(\s*\$})$/g, '');
                var value = Object.byString(envObj, tag);

                if (value && value !== Object(value)) {

                    sourceObj[key] = value;
                }
            });
        }
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
    flatObj
) {

    var returnString = stringTemplate;
    var result = {};

    // https://stackoverflow.com/questions/11592033/regex-match-text-between-tags
    stringTemplate.match(/{\$(.*?)\$}/g).forEach(function (rawTag) {
        var tag = rawTag.replace(/(^{\$\s*)|(\s*\$})$/g, '');
        var value = Object.byString(flatObj, tag);

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
 * json object with environment properties merged out 
 */
function deEnvObject(
    sourceObj,
    targetEnvironment) {

    for (const key in sourceObj) {

        var target = sourceObj[key];

        if (isObject(target)) {

            deEnvObject(target, targetEnvironment);

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
    mapBranches: mapBranches,
    resolveVariableReferences: resolveVariableReferences,
    flattenObj: flattenObj,
    environMe: environMe,
    convertStringTemplate: convertStringTemplate,
    mergeDeep: mergeDeep,
    deEnvObject: deEnvObject
}