#!/usr/bin/env node

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const yargs = require("yargs");
const lib = require('./environme')


// https://www.sitepoint.com/javascript-command-line-interface-cli-node-js/

clear();

console.log(
  chalk.yellowBright(
    figlet.textSync('environme', { horizontalLayout: 'full' })
  )
);

const options = yargs
  .usage("Usage: -path <path> -env <environment>")
  .option("path", { alias: "p", describe: "Path to template file, can use wild card such as **/* to locate multiple files", type: "string", demandOption: true })
  .option("env", { alias: "e", describe: "Target environment, which will be used to generate environmemt configuration", type: "string" })
  .option("verbose", { alias: "v", describe: "Run with verbose logging", type: "boolean", default: false })
  .argv;

  console.log(`--path ${options.path}`)
  console.log(`--env ${options.env}`)

  if(options.path){
    lib.environMe(options.path, options.env, options.verbose);
  } else {

    if(!options.path){
      console.error(`Could not run environme me as required parameter --path is empty`)
    }
  }


