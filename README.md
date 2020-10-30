![Node.js CI](https://github.com/jarrodconnolly/ico-tools/workflows/Node.js%20CI/badge.svg)
![CodeQL](https://github.com/jarrodconnolly/ico-tools/workflows/CodeQL/badge.svg)
# ico-tools [WIP]
Tools for building and validating ICO files.

## TODO
* Describe supported input formats
* Document specifics of ICO variations supported
* Add output size options to CLI

## Build
Build an ICO file with multiple resolutions from a single PNG.
```
npm install ico-tools
```
``` js
const { build } = require('ico-tools');

const inputFileData = await fs.readFile('input.png');
const imageBuffer = await build(inputFileData, icoOptions);
await fs.writeFile('output.ico', imageBuffer);
```


## Parse
Parse and return detailed metadata from an ICO in JSON format.
``` js
const { parse } = require('ico-tools');

const inputFileData = await fs.readFile('output.ico');
const data = await parse(inputFileData);
```
``` json
{
  "header": {
    "reserved": 0,
    "imageType": 1,
    "imageTypeName": "ICO",
    "imageCount": 3
  },
    <-- trimmed -->
}
```

## CLI
Wrapper to use the Build and Parse functions from the command line.

```
Usage: ico-tools [options] [command]

Options:
  -V, --version                     output the version number
  -h, --help                        display help for command

Commands:
  build [options] <input> <output>
  parse <input>
  help [command]                    display help for command
```

```
Usage: ico-tools build [options] <input> <output>

Options:
  -d, --debug  debug log messages
  -h, --help   display help for command
```

```
Usage: ico-tools parse [options] <input>

Options:
  -h, --help  display help for command
```
