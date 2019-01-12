<p align="center">
<img src="assets/logo.png" height="150" title="Icon made by Freepik (www.freepik.com) available at www.flaticon.com. CC 3.0 BY licensed (http://creativecommons.org/licenses/by/3.0/)">
</p>

<h1 align="center">Instamancer</h1>

[![Build Status](https://travis-ci.com/ScriptSmith/instamancer.svg?token=s9KJfKerUtoC75SEgCjT&branch=master)](https://travis-ci.com/ScriptSmith/instamancer)
[![Quality](https://img.shields.io/codacy/grade/98066a13fa444845aa3902d180581b86.svg)]()
[![NPM](https://img.shields.io/npm/v/instamancer.svg)](https://www.npmjs.com/package/instamancer)
[![License](https://img.shields.io/github/license/scriptsmith/instamancer.svg)](https://github.com/ScriptSmith/instamancer/blob/master/LICENSE)
[![Chat](https://img.shields.io/gitter/room/instamancer/instamancer.svg)](https://gitter.im/instamancer) 

Scrape Instagram's API with Puppeteer.

###### [Install](#Install) | [Usage](#Usage) | [Website](https://scriptsmith.github.io/instamancer/) | [FAQ](FAQ.md)


Instamancer is a new type of scraping tool that leverages Puppeteer's ability to intercept requests made by a webpage to an API.

Read more about how Instamancer works [here](https://scriptsmith.github.io/instamancer/).

### Features
- Scrape hashtags, locations and users
- Output JSON, CSV
- Download media
- Batch scraping
- Headless mode

## Install

#### Linux
See [Puppeteer troubleshooting](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#chrome-headless-fails-due-to-sandbox-issues)

Enable user namespace cloning:
```
sysctl -w kernel.unprivileged_userns_clone=1
``` 

Or run without a sandbox:

```
# WARNING: unsafe
export NO_SANDBOX=true
```

### From this repository
Requires [TypeScript](https://github.com/Microsoft/TypeScript#installing)

```
git clone https://github.com/ScriptSmith/instamancer.git
cd instamancer
npm install
npm install -g
``` 

### From NPM

```
npm install -g instamancer
```

If you're using root to install globally, use the following command to install the Puppeteer dependency

```
sudo npm install -g instamancer --unsafe-perm=true
```

### From NPX

```
npx instamancer
```

## Usage

### Command Line
```
$ instamancer
Usage: instamancer <command> [options]

Commands:
  instamancer hashtag [id]       Scrape a hashtag
  instamancer location [id]      Scrape a location
  instamancer user [id]          Scrape a user
  instamancer batch [batchfile]  Read newline-separated arguments from a file

Options:
  --help                         Show help                             [boolean]
  --version                      Show version number                   [boolean]
  --count, -c                    Number of posts to download. 0 to download all
                                                                    [default: 0]
  --visible                      Show browser on the screen     [default: false]
  --download, -d                 Save images and videos from posts
                                                      [boolean] [default: false]
  --graft, -g                    Enable grafting       [boolean] [default: true]
  --full                         Get the full details about posts from the API
                                                      [boolean] [default: false]
  --video                        Download videos. Only works in full mode
                                                      [boolean] [default: false]
  --silent                       Disable progress output
                                                      [boolean] [default: false]
  --waitDownload, -w             When true, media will only download once
                                 scraping is finished [boolean] [default: false]
  --filename, --file, -f         Name of the output file       [default: "[id]"]
  --filetype, --type, -t         Type of output file
                              [choices: "csv", "json", "both"] [default: "json"]
  --downdir                      Directory to save thumbnails
                                          [default: "downloads/[endpoint]/[id]"]
  --logging                      Level of logger
                   [choices: "error", "none", "info", "debug"] [default: "none"]
  --logfile                      Name of the log file
                                                    [default: "instamancer.log"]

Examples:
  instamancer hashtag instagood -d          Download all the available posts,
                                            and their thumbnails from #instagood
  instamancer location 644269022 --count    Download 200 posts tagged as being
  200                                       at the Arc Du Triomphe
  instamancer user arianagrande             Download Ariana Grande's posts to a
  --filetype=csv --logging=info --visible   CSV file with a non-headless
                                            browser, and log all events

Source code available at https://github.com/ScriptSmith/instamancer
```

### Module

ES2018 Typescript example:
```typescript
import * as Instamancer from "instamancer";

const options: Instamancer.IOptions = {
    total: 10
};

const hashtag = Instamancer.hashtag("beach", options);
(async () => {
    for await (const post of hashtag) {
        console.log(post);
    }
})();
```

#### Generator functions

```typescript
Instamancer.hashtag(id, options);
Instamancer.location(id, options);
Instamancer.user(id, options);
```

#### Options
```typescript
const options: Instamancer.IOptions = {
    // Total posts to download. 0 for unlimited
    total: number,

    // Run Chrome in headless mode
    headless: boolean,

    // Logging events
    logger: winston.Logger,

    // Run without output to stdout
    silent: boolean,

    // Time to sleep between interactions with the page
    sleepTime: number,

    // Enable the grafting process
    enableGrafting: boolean,

    // Extract the full amount of information from the API
    fullAPI: boolean,
}
```