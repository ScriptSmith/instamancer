<p align="center">
<img src="assets/logo.png" height="150" title="Icon made by Freepik (www.freepik.com) available at www.flaticon.com. CC 3.0 BY licensed (http://creativecommons.org/licenses/by/3.0/)">
</p>

<h1 align="center">Instamancer</h1>

[![Build Status](https://travis-ci.com/ScriptSmith/instamancer.svg?token=s9KJfKerUtoC75SEgCjT&branch=master)](https://travis-ci.com/ScriptSmith/instamancer)
[![Coverage](https://img.shields.io/codecov/c/github/scriptsmith/instamancer.svg)](https://codecov.io/gh/scriptsmith/instamancer/)
[![Chat](https://img.shields.io/gitter/room/instamancer/instamancer.svg)](https://gitter.im/instamancer) 

###### [Install](#Install) | [Usage](#Usage) | [FAQ](FAQ.md)

Scrape Instagram's API with Puppeteer.

## Features
- Scrape hashtags, locations and users
- JSON, CSV output
- Image downloading
- Batch scraping
- Headless mode


Traditional Instagram scrapers either use a browser to access a web-page and read the DOM, or they manually reimplement the requests that browsers make to an API endpoint. This isn't ideal because:
 
1. Reading the DOM ignores some information that's only stored in memory.
2. Reimplementing requests requires the deciphering and reproduction of pagination and authentication mechanisms.
3. Both methods don't easily tolerate changes to the front and back end.

Instamancer is unique because it doesn't read the DOM or reimplement requests. Using [Puppeteer](https://github.com/GoogleChrome/puppeteer/) it interacts with Instagram.com, then intercepts and saves the responses to requests that the page's JavaScript initiates. This means that it can retrieve the full amount of information from the API while tolerating failed requests and rate limits, without having to reimplement client-side code. This makes it much better at withstanding regular changes to the interface and API.

As browsers become more and more like black boxes, this new scraping method will become increasingly relevant.

Instamancer also comes with some clever tricks:

- Because using a browser consumes lots of memory in large scraping jobs, Instamancer will intercept and save the URL and headers of each request and then restart the browser after a certain number of interactions with the page. Once a new page initiates the first request to the API, its URL and headers are swapped on-the-fly with the most recently saved ones. The scraping continues without incident because the response from the API is in the correct form despite being for the incorrect data. This new (as far as I know) technique is called *grafting*.
- Requests from pages for media and other non-API urls are intercepted and aborted to speed up scraping and conserve resources.
- Instagram sends limited information through its feed API. To get extra information like the location, tagged users, and comments, Instamancer can open new tabs for each post that it scrapes, and then read the metadata from memory.


## Install
Instamancer requires [TypeScript](https://github.com/Microsoft/TypeScript#installing)

#### From this repository

```
git clone https://github.com/ScriptSmith/instamancer.git
cd instamancer
npm install
npm install -g
``` 

#### From NPX

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
  --filename, --file, -f, --out  Name of the output file       [default: "[id]"]
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

### Library

Typescript example:
```typescript
import * as Instamancer from "instamancer";

const options: Instamancer.IOptions = {total: 100};

// Asynchronous hashtag
const hashtag = new Instamancer.Hashtag("beach", options);
(async () => {
    for await (const post of hashtag.generator()) {
        console.log(post);
    }
})();
```