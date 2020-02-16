#!/usr/bin/env node

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const yargs = require("yargs");
const lib = require('./environme')


// https://www.sitepoint.com/javascript-command-line-interface-cli-node-js/

console.log(
  chalk.yellowBright(
    figlet.textSync('environme', { horizontalLayout: 'full' })
  )
);

const options = yargs
  .usage("Usage: -path <path> -env <environment>")
  .option("path", { alias: "p", describe: "Path to template file, can use wild card such as **/* to locate multiple files", type: "string", demandOption: true })
  .option("env", { alias: "e", describe: "Target environment, which will be used to generate environmemt configuration", type: "string", default: "" })
  .option("verbose", { alias: "v", describe: "true, if should run with verbose logging", type: "boolean", default: false })
  .option("output-vars", { alias: "o", describe: "true, if should output config object to environment variables", type: "boolean", default: false })
  .option("branch", { alias: "b", describe: `If set, match against branch mapping to determine environment. ensure you have a key called branch_mapping in your props.yml in form branch1=Evn1,branch2=Env2..`, type: "string", default: "" })
  .argv;

console.log(`--path ${options.path}`);
console.log(`--env ${options.env}`);
console.log(`--verbose ${options.verbose}`);
console.log(`--output-vars ${options['output-vars']}`);
console.log(`--branch ${options.branch}`);

try {
  if (options.path) {

    var targetEnv = options.env;

    if(options.mapping){
      targetEnv = urbanantics.getBranchMapping(options.path, options.branch);
    }

    const varsObj = lib.environMe(options.path, targetEnv, options.verbose);

    if (options["output-vars"]) {
      const flatObj = lib.flattenObj(varsObj);
      for (const key in flatObj) {

        const val = flatObj[key];

        process.env[key] = val;

        console.log(process.env)
      }
    }
  } else {

    if (!options.path) {
      console.error(`Could not run environme me as required parameter --path is empty`)
    }
  }
} catch (err) {
  console.error(err)
}



