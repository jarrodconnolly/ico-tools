#!/usr/bin/env node
/* eslint-disable no-console */

'use strict';

const fs = require('fs').promises;
const { program } = require('commander');
const { build, parse } = require('../index');
const packageJson = require('../package.json');

const cliName = Object.keys(packageJson.bin)[0];

async function runBuild(input, output, cmd) {
  const options = cmd.opts();
  const icoOptions = {
    debug: options.debug,
  };

  try {
    const inputFileData = await fs.readFile(input);
    const imageBuffer = await build(inputFileData, icoOptions);
    await fs.writeFile(output, imageBuffer);
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error('Input file not found.');
    }
    throw e;
  }
}

async function runParse(input) {
  try {
    const inputFileData = await fs.readFile(input);
    const data = await parse(inputFileData);
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error('Input file not found.');
    }
    throw e;
  }
}

async function main() {
  program
    .version(packageJson.version)
    .name(cliName);

  program.command('build <input> <output>')
    .option('-d, --debug', 'debug log messages')
    .action(runBuild);

  program.command('parse <input>')
    .action(runParse);

  await program.parseAsync(process.argv);
}

main()
  .then(() => {
    console.log('Complete.');
  })
  .catch((e) => {
    console.log(`${cliName} failed. ${e.message}`);
  });
