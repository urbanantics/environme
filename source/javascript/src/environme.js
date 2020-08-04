const glob = require("glob");
const fs = require('fs');
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
    targetEnvironments,
    verboseLogs
) {

    try {

        var returnObj = {};

        var templates = getTemplatePaths(path);
        
        if (verboseLogs) {
            console.log("List of template files to be environme'd");
            console.log(templates);
        }

        for (let index = 0; index < templates.length; index++) {

            const template = templates[index];
            const rawTemplate = fs.readFileSync(template.file, 'utf8') || "";
            const propsObj = yaml.safeLoad(fs.readFileSync(template.propsFile, 'utf8'));

            if (verboseLogs) {
                console.log("*** input yml config ***");
                console.log(propsObj);
            }

            const noEnvObj = deEnvObject(propsObj, targetEnvironments);

            if (verboseLogs) {
                console.log("*** flattened yml config ***");
                console.log(noEnvObj);
            }

            const outputString = convertStringTemplate(rawTemplate, noEnvObj);

            fs.writeFileSync(template.outputFile, outputString, 'utf8');

            returnObj = mergeDeep(noEnvObj, returnObj);
        }

        return returnObj;

    } catch (err) {
        console.error(err)
    }
}

function getTemplatePaths(path){

    // https://github.com/isaacs/node-glob
    const files = glob.sync(path);
    var templates = [];

    files.forEach(function (file) {

        if (file.match(/\.props\.yml/)) {
            console.log(`Matched props file ${file}`);

            const temp = file.replace(/\.template.*/, '');
            const fileStart = file.replace(/\.props\.yml/, '');

            var match = "";
            files.forEach(function (el) {
                if (el.includes(`${fileStart}.template`)) {
                    match = el;
                }
            });

            //el.match(/\.template/
            //const propsFile = `${temp}.props.yml`;
            //const outputFile = `${temp}${ext}`;

            const outputFile = match.replace(/\.template/, '');

            console.log(`Matched template file ${match}`);
            console.log(`Output file ${outputFile}`);

            templates.push({
                propsFile: file,
                file: match,
                outputFile: outputFile
            });
        }
    });

    return templates;

}

function getBranchMapping(
    path,
    branch,
    verboseLogs
){

    var templates = getTemplatePaths(path);
    var mergeObj = {};

    for (let index = 0; index < templates.length; index++) {

        const template = templates[index];

        const propsObj = yaml.safeLoad(fs.readFileSync(template.propsFile, 'utf8'));

        if (verboseLogs) {
            console.log("*** Get Branch Mapping input yml config ***");
            console.log(propsObj);
        }

        mergeObj = mergeDeep(propsObj, mergeObj);
    }

    const mapping = findKey(mergeObj, "branch_mapping", verboseLogs);

    console.log(`MAPPING`)
    console.log(mapping)

    for (const key in mapping) {

        var target = mapping[key];

        console.log(`- checking mapping key:${key}, target:${target} against ${branch}`)

        if(branch.includes(target)){
            return key;
        }
    }
}

function findKey(sourceObj, searchKey){

    for (const key in sourceObj) {

        var target = sourceObj[key];

        if (key == searchKey){

            console.log(`found key ${key}`)
            console.log(target)
            return target;
        }

        if (isObject(target)) {
            return findKey(target, searchKey)
        }
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

    if (verboseLogs) {
        console.log(`branchesStr ${branchesStr}`);
        console.log(`currentBranch ${currentBranch}`);
        console.log("branches:");
        console.log(branches);
    }

    for (let index = 0; index < branches.length; index++) {
        const branch = branches[index];

        const branchSplit = branch.split('=');

        if (branchSplit.length != 2) {
            continue;
        }
        if (currentBranch.includes(branchSplit[0])) {
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

            if (keyIn) {
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
            (target.match(/{\$(.*?)\$}/g) || []).forEach(function (rawTag) {
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

    var returnString = stringTemplate || "";
    var result = {};

    if (!stringTemplate) return "";

    // https://stackoverflow.com/questions/11592033/regex-match-text-between-tags
    (stringTemplate.match(/{\$(.*?)\$}/g) || []).forEach(function (rawTag) {
        var tag = rawTag.replace(/(^{\$\s*)|(\s*\$})$/g, '');
        var value = Object.byString(flatObj, tag);

        if (value && value !== Object(value)) {

            result[rawTag] = value;
        }

    });

    for (const key in result) {

        var searchMaskEsc = escapeRegex(key);
        var regEx = new RegExp(searchMaskEsc, "ig");
        var replaceMask = result[key];

        console.log(`key:${key},searchMaskEsc:${searchMaskEsc},replacemask:${replaceMask}`);

        returnString = returnString.replace(regEx, replaceMask);

        //returnString = returnString.split(key).join(result[key]);
    }

    return returnString;
}

function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
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
    targetEnvironments) {

    if(!Array.isArray(targetEnvironments)){
        console.log(`<${targetEnvironments}> is not an array, turning into array`);
        targetEnvironments = [targetEnvironments]; 
    }

    for (const targetEnvironment of targetEnvironments){

        for (const key in sourceObj) {

            var target = sourceObj[key];
    
            if (isObject(target)) {
    
                deEnvObject(target, targetEnvironment);
    
            }
    
            if (key.toLowerCase() == targetEnvironment.toLowerCase()) {
    
                const envProp = sourceObj[key];
    
                //delete sourceObj[key];
    
                sourceObj = mergeDeep(sourceObj, envProp);
            }
    
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
    getBranchMapping: getBranchMapping,
    mapBranches: mapBranches,
    resolveVariableReferences: resolveVariableReferences,
    flattenObj: flattenObj,
    environMe: environMe,
    convertStringTemplate: convertStringTemplate,
    mergeDeep: mergeDeep,
    deEnvObject: deEnvObject
}