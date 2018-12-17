<img src="logo.png" height="100" align="right" title="Icon made by Freepik (www.freepik.com) from www.flaticon.com is licensed by CC 3.0 BY (http://creativecommons.org/licenses/by/3.0/)">


# Instamancer
[![Build Status](https://travis-ci.com/ScriptSmith/instamancer.svg?token=s9KJfKerUtoC75SEgCjT&branch=master)](https://travis-ci.com/ScriptSmith/instamancer)

Scrape the Instagram API with Puppeteer.

## Features
- Scrape hashtags, locations and users
- Use the actual GraphQL API by manipulating the page and intercepting requests, not reading the DOM
- JSON, CSV output
- Download images
- Batch scraping
- Run headlessly
- 'Grafting' process to save resources in large scraping jobs

## Install
```
npm install
npm run build
sudo npm install -g
``` 

## Usage
```
$ instamancer
Usage: instamancer <command> [options]

Commands:
  instamancer hashtag [id]       Scrape a hashtag
  instamancer location [id]      Scrape a location
  instamancer user [id]          Scrape a user
  instamancer batch [batchfile]  Read a list of arguments from a file

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
  --silent                       Disable progress output
                                                      [boolean] [default: false]
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
