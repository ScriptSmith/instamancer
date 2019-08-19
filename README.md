<p align="center">
<img src="assets/logo.png" height="150" title="Icon made by Freepik (www.freepik.com) available at www.flaticon.com. CC 3.0 BY licensed (http://creativecommons.org/licenses/by/3.0/)">
</p>

<h1 align="center">Instamancer</h1>

[![Build Status](https://travis-ci.com/ScriptSmith/instamancer.svg?token=s9KJfKerUtoC75SEgCjT&branch=master)](https://travis-ci.com/ScriptSmith/instamancer)
[![Quality](https://img.shields.io/codacy/grade/98066a13fa444845aa3902d180581b86.svg)](https://app.codacy.com/project/ScriptSmith/instamancer/dashboard)
[![Coverage](https://img.shields.io/codacy/coverage/98066a13fa444845aa3902d180581b86.svg)](https://app.codacy.com/project/ScriptSmith/instamancer/dashboard)
[![Speed](https://firebasestorage.googleapis.com/v0/b/instagram-speed-test.appspot.com/o/instamancer.svg?alt=media&token=dcc3e623-ee88-4d74-ae86-2d969a1cd8ad)](https://scriptsmith.github.io/instagram-speed-test)
[![NPM](https://img.shields.io/npm/v/instamancer.svg)](https://www.npmjs.com/package/instamancer)
[![Dependencies](https://david-dm.org/scriptsmith/instamancer/status.svg)](https://david-dm.org/scriptsmith/instamancer)
[![Chat](https://img.shields.io/gitter/room/instamancer/instamancer.svg)](https://gitter.im/instamancer)

Scrape Instagram's API with Puppeteer.

###### [Install](#Install) | [Usage](#Usage) | [Comparison](#Comparison) | [Website](https://scriptsmith.github.io/instamancer/) | [FAQ](FAQ.md)


Instamancer is a new type of scraping tool that leverages Puppeteer's ability to intercept requests made by a webpage to an API.

Read more about how Instamancer works [here](https://scriptsmith.github.io/instamancer/).

### Features
- Scrape hashtags and users
- Output JSON, CSV
- Download images, albums, and videos
- Batch scraping
- Search hashtags/users
- API response validation

### Data
Metadata that Instamancer is able to gather from posts:

- Text
- Timestamps
- Tagged users
- Accessibility captions
- Like counts
- Comment counts
- Images (Thumbnails, Dimensions, URLs)
- Videos (URL, View count, Duration)
- Comments (Timestamp, Text, Like count, User)
- User (Username, Full name, Profile picture, Profile privacy)
- Location (Name, Street, Zip code, City, Region, Country)

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

#### Without downloading chromium
If you wish to install Instamancer without downloading chromium, enable the `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` environment variable before installation

```
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### From this repository
Requires [TypeScript](https://github.com/Microsoft/TypeScript#installing)

```
git clone https://github.com/ScriptSmith/instamancer.git
cd instamancer
npm install
npm run build
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
  instamancer user [id]          Scrape a user
  instamancer post [ids]         Scrape a comma-separated list of posts
  instamancer search [query]     Perform a search of users, tags and places
  instamancer batch [batchfile]  Read newline-separated arguments from a file

Options:
  --help                  Show help                                    [boolean]
  --version               Show version number                          [boolean]
  --count, -c             Number of posts to download. 0 to download all
                                                                    [default: 0]
  --visible               Show browser on the screen            [default: false]
  --download, -d          Save images and videos from posts
                                                      [boolean] [default: false]
  --graft, -g             Enable grafting              [boolean] [default: true]
  --full                  Get the full list of posts and their details from the
                          API and web page            [boolean] [default: false]
  --video                 Download videos. Only works in full mode
                                                      [boolean] [default: false]
  --silent                Disable progress output     [boolean] [default: false]
  --strict                Throw an error if types from Instagram API have been
                          changed                     [boolean] [default: false]
  --sync                  Synchronously download files between API requests
                                                      [boolean] [default: false]
  --threads, -k           The number of parallel download / upload threads
                                                           [number] [default: 4]
  --waitDownload, -w      When true, media will only download once scraping is
                          finished                    [boolean] [default: false]
  --filename, --file, -f  Name of the output file              [default: "[id]"]
  --filetype, --type, -t  Type of output file
                              [choices: "csv", "json", "both"] [default: "json"]
  --downdir               Directory / Container to save media
                                          [default: "downloads/[endpoint]/[id]"]
  --mediaPath, --mp       Store the paths of downloaded media in the
                          '_mediaPath' key            [boolean] [default: false]
  --logging               Level of logger
                   [choices: "error", "none", "info", "debug"] [default: "none"]
  --logfile               Name of the log file      [default: "instamancer.log"]
  --browser               Location of the browser. Defaults to the copy
                          downloaded at installation
  --swift                 Upload media to openstack's swift object storage
                          rather than saving to disk  [boolean] [default: false]

Examples:
  instamancer hashtag instagood -d          Download all the available posts,
                                            and their thumbnails from #instagood
  instamancer user arianagrande             Download Ariana Grande's posts to a
  --filetype=csv --logging=info --visible   CSV file with a non-headless
                                            browser, and log all events

Source code available at https://github.com/ScriptSmith/instamancer
```

### Module

ES2018 Typescript example:
```typescript
import {createApi,IOptions} from "instamancer"

const options: IOptions = {
    total: 10
};

const hashtag = createApi("hashtag", "beach", options);
(async () => {
    for await (const post of hashtag) {
        console.log(post);
    }
})();
```

#### Generator functions

```typescript
import {createApi} from "instamancer"
createApi("hashtag", id, options);
createApi("user", id, options);
createApi("post", ids, options);
createApi("search", query, options);
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

    // Throw an error if type validation has been failed
    strict?: boolean,

    // Time to sleep when rate-limited
    hibernationTime: number,

    // Enable the grafting process
    enableGrafting: boolean,

    // Extract the full amount of information from the API
    fullAPI: boolean,

    // Use a proxy in Chrome to connect to Instagram
    proxyURL: string,

    // Location of the chromium / chrome binary executable
    executablePath: string,

    // Custom io-ts validator
    validator?: Type<unknown>
}
```

## Comparison

A comparison of Instagram scraping tools. Please suggest more tools and criteria through a pull request.

To see a speed comparison, visit [this page](https://scriptsmith.github.io/instagram-speed-test)

<table>
<thead>
    <tr>
        <th>Tool</th>
        <th>Hashtags</th>
        <th>Users</th>
        <th>Posts</th>
        <th>Login not required</th>
        <th>Private feeds</th>
        <th>Batch mode</th>
        <th>Command-line</th>
        <th>Library/Module</th>
        <th>Download media</th>
        <th>Download metadata</th>
        <th>Scraping method</th>
        <th>Daily builds</th>
        <th>Main language</th>
        <th>Speed ____________________________</th>
        <th>License ____________________________</th>
        <th>Last commit ____________________________</th>
        <th>Open Issues ____________________________</th>
        <th>Closed Issues ____________________________</th>
        <th>Build status ____________________________</th>
        <th>Test coverage ____________________________</th>
        <th>Code quality ____________________________</th>
    </tr>
</thead>
<tbody>
    <tr>
        <td><a href="https://github.com/ScriptSmith/instamancer">Instamancer</a></td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:x:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>Web API request interception</td>
        <td>:heavy_check_mark:</td>
        <td>Typescript</td>
        <td><a href="https://scriptsmith.github.io/instagram-speed-test"><img src="https://firebasestorage.googleapis.com/v0/b/instagram-speed-test.appspot.com/o/instamancer.svg?alt=media&token=dcc3e623-ee88-4d74-ae86-2d969a1cd8ad"></a></td>
        <td><img src="https://img.shields.io/github/license/scriptsmith/instamancer.svg"></td>
        <td><img src="https://img.shields.io/github/last-commit/scriptsmith/instamancer.svg"></td>
        <td><img src="https://img.shields.io/github/issues/scriptsmith/instamancer.svg"></td>
        <td><img src="https://img.shields.io/github/issues-closed/scriptsmith/instamancer.svg"></td>
        <td><img src="https://img.shields.io/travis/com/ScriptSmith/instamancer.svg"></td>
        <td><img src="https://img.shields.io/codacy/coverage/98066a13fa444845aa3902d180581b86.svg"></td>
        <td><img src="https://img.shields.io/codacy/grade/98066a13fa444845aa3902d180581b86.svg"></td>
    </tr>
    <tr>
        <td><a href="https://github.com/ScriptSmith/instaphyte">Instaphyte</a></td>
        <td>:heavy_check_mark:</td>
        <td>:x:</td>
        <td>:x:</td>
        <td>:heavy_check_mark:</td>
        <td>:x:</td>
        <td>:x:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>Web API simulation</td>
        <td>:heavy_check_mark:</td>
        <td>Python</td>
        <td><a href="https://scriptsmith.github.io/instagram-speed-test"><img src="https://firebasestorage.googleapis.com/v0/b/instagram-speed-test.appspot.com/o/instaphyte.svg?alt=media&token=8e16505d-1259-42a4-90bc-cf8a6d326f55"></a></td>
        <td><img src="https://img.shields.io/github/license/scriptsmith/instaphyte.svg"></td>
        <td><img src="https://img.shields.io/github/last-commit/scriptsmith/instaphyte.svg"></td>
        <td><img src="https://img.shields.io/github/issues/scriptsmith/instaphyte.svg"></td>
        <td><img src="https://img.shields.io/github/issues-closed/scriptsmith/instaphyte.svg"></td>
        <td><img src="https://img.shields.io/travis/ScriptSmith/instaphyte.svg"></td>
        <td><img src="https://img.shields.io/codacy/coverage/a2322f650025499bb8aee2368ca43207.svg"></td>
        <td><img src="https://img.shields.io/codacy/grade/a2322f650025499bb8aee2368ca43207.svg"></td>
    </tr>
    <tr>
        <td><a href="https://github.com/instaloader/instaloader">Instaloader</a></td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:x:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>Web API simulation</td>
        <td>:x:</td>
        <td>Python</td>
        <td><a href="https://scriptsmith.github.io/instagram-speed-test"><img src="https://firebasestorage.googleapis.com/v0/b/instagram-speed-test.appspot.com/o/instaloader.svg?alt=media&token=e7b05b24-6c96-43b7-9e5e-4951f7b1d9ba"></a></td>
        <td><img src="https://img.shields.io/github/license/instaloader/instaloader.svg"></td>
        <td><img src="https://img.shields.io/github/last-commit/instaloader/instaloader.svg"></td>
        <td><img src="https://img.shields.io/github/issues/instaloader/instaloader.svg"></td>
        <td><img src="https://img.shields.io/github/issues-closed/instaloader/instaloader.svg"></td>
        <td><img src="https://img.shields.io/travis/instaloader/instaloader.svg"></td>
        <td>:question:</td>
        <td>:question:</td>
    </tr>
    <tr>
        <td><a href="https://github.com/althonos/InstaLooter">Instalooter</a></td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:x:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>Web API simulation</td>
        <td>:x:</td>
        <td>Python</td>
        <td><a href="https://scriptsmith.github.io/instagram-speed-test"><img src="https://firebasestorage.googleapis.com/v0/b/instagram-speed-test.appspot.com/o/instalooter.svg?alt=media&token=ed9564f5-6011-4090-95e7-2b80e7f6e41f"></a></td>
        <td><img src="https://img.shields.io/github/license/althonos/instalooter.svg"></td>
        <td><img src="https://img.shields.io/github/last-commit/althonos/instalooter.svg"></td>
        <td><img src="https://img.shields.io/github/issues/althonos/instalooter.svg"></td>
        <td><img src="https://img.shields.io/github/issues-closed/althonos/instalooter.svg"></td>
        <td><img src="https://img.shields.io/travis/althonos/InstaLooter.svg"></td>
        <td><img src="https://img.shields.io/codecov/c/github/althonos/InstaLooter.svg"></td>
        <td><img src="https://img.shields.io/codacy/grade/9b8c7da6887c4195b9e960cb04b59a91.svg"></td>
    </tr>
    <tr>
        <td><a href="https://github.com/huaying/instagram-crawler">Instagram crawler</a></td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:x:</td>
        <td>:x:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:x:</td>
        <td>:heavy_check_mark:</td>
        <td>Web DOM reading</td>
        <td>:x:</td>
        <td>Python</td>
       <td>:question:</td>
        <td><img src="https://img.shields.io/github/license/huaying/instagram-crawler.svg"></td>
        <td><img src="https://img.shields.io/github/last-commit/huaying/instagram-crawler.svg"></td>
        <td><img src="https://img.shields.io/github/issues/huaying/instagram-crawler.svg"></td>
        <td><img src="https://img.shields.io/github/issues-closed/huaying/instagram-crawler.svg"></td>
        <td><img src="https://img.shields.io/travis/huaying/instagram-crawler.svg"></td>
        <td>:question:</td>
        <td>:question:</td>
    </tr>
    <tr>
        <td><a href="https://github.com/rarcega/instagram-scraper">Instagram Scraper</a></td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:x:</td>
        <td>:x:</td>
        <td>:heavy_check_mark:</td>
        <td>:x:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>Web API simulation</td>
        <td>:x:</td>
        <td>Python</td>
        <td><a href="https://scriptsmith.github.io/instagram-speed-test"><img src="https://firebasestorage.googleapis.com/v0/b/instagram-speed-test.appspot.com/o/instagram-scraper.svg?alt=media&token=ecdf626f-e3fd-4959-b047-5b13f244370b"></a></td>
        <td><img src="https://img.shields.io/github/license/rarcega/instagram-scraper.svg"></td>
        <td><img src="https://img.shields.io/github/last-commit/rarcega/instagram-scraper.svg"></td>
        <td><img src="https://img.shields.io/github/issues/rarcega/instagram-scraper.svg"></td>
        <td><img src="https://img.shields.io/github/issues-closed/rarcega/instagram-scraper.svg"></td>
        <td><img src="https://img.shields.io/travis/rarcega/instagram-scraper.svg"></td>
        <td>:question:</td>
        <td>:question:</td>
    </tr>
    <tr>
        <td><a href="https://github.com/ping/instagram_private_api">Instagram Private API</a></td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:x:</td>
        <td>:x:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>App and Web API simulation</td>
        <td>:x:</td>
        <td>Python</td>
        <td>:question:</td>
        <td><img src="https://img.shields.io/github/license/ping/instagram_private_api.svg"></td>
        <td><img src="https://img.shields.io/github/last-commit/ping/instagram_private_api.svg"></td>
        <td><img src="https://img.shields.io/github/issues/ping/instagram_private_api.svg"></td>
        <td><img src="https://img.shields.io/github/issues-closed/ping/instagram_private_api.svg"></td>
        <td><img src="https://img.shields.io/travis/ping/instagram_private_api.svg"></td>
        <td>:question:</td>
        <td>:question:</td>
    </tr>
    <tr>
        <td><a href="https://github.com/postaddictme/instagram-php-scraper">Instagram PHP Scraper</a></td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:x:</td>
        <td>:x:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>:heavy_check_mark:</td>
        <td>Web API simulation</td>
        <td>:x:</td>
        <td>PHP</td>
        <td>:question:</td>
        <td><img src="https://img.shields.io/github/license/postaddictme/instagram-php-scraper.svg"></td>
        <td><img src="https://img.shields.io/github/last-commit/postaddictme/instagram-php-scraper.svg"></td>
        <td><img src="https://img.shields.io/github/issues/postaddictme/instagram-php-scraper.svg"></td>
        <td><img src="https://img.shields.io/github/issues-closed/postaddictme/instagram-php-scraper.svg"></td>
        <td>:question:</td>
        <td>:question:</td>
        <td>:question:</td>
    </tr>
</tbody>
</table>
