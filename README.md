<p align="center">
<img src="logo.png" height="150" title="Icon made by Freepik (www.freepik.com) available at www.flaticon.com. CC 3.0 BY licensed (http://creativecommons.org/licenses/by/3.0/)">
</p>

<h1 align="center">Instamancer</h1>

[![Build Status](https://travis-ci.com/ScriptSmith/instamancer.svg?token=s9KJfKerUtoC75SEgCjT&branch=master)](https://travis-ci.com/ScriptSmith/instamancer)

Scrape Instagram's API with Puppeteer.

Traditional Instagram scrapers either use a browser to access a web-page and read information from the DOM, or they manually reimplement the requests that browsers make to an API endpoint. This isn't ideal because reading from the DOM ignores some information that's only stored in memory, reimplementing requests requires the deciphering and reproduction of pagination and authentication mechanisms, and both methods don't easily tolerate changes to the front and back end.

Instamancer is unique because it doesn't read from the DOM or reimplement requests. Using [Puppeteer](https://github.com/GoogleChrome/puppeteer/), it interacts with Instagram.com like a normal user then intercepts and saves the responses to requests that the page's JavaScript initiates. This means that it can retrieve the full amount of information from the API while tolerating failed requests and rate limits, without having to reimplement request code. It is also more tolerant to changes made to the interface and API.

As browsers become more and more like black boxes, this new scraping method will become more useful.

Instamancer also comes a couple of clever tricks:

1) Because using a browser consumes lots of memory in large scraping jobs, Instamancer will intercept and save the URL and headers of each request and then restart the browser after a certain number of interactions with the page. Once a new page initiates the first request to the API, its URL and headers are swapped on-the-fly with the most recently saved ones. The scraping continues without incident because the response from the API is in the correct form despite being for the incorrect data. This new (as far as I know) technique is called *grafting*

2) Instagram sends limited information through its feed API. To get extra information like the location, tagged users, and comments, Instamancer can open new tabs for each post that it scrapes, and then read the metadata from memory.

## Features
- Scrape hashtags, locations and users
- JSON, CSV output
- Download images
- Batch scraping
- Run headlessly

## Install
```
# Requires TypeScript
git clone https://github.com/ScriptSmith/instamancer.git
cd instamancer
npm install
npm run build
sudo npm install -g
``` 

or

```
npx instamancer
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

## FAQ
### Does it still work?
At the time of writing, Instamancer still works. It's possible that it will break when Instagram.com is updated, or Instagram tries to curb this method of scraping.

### Is there a GUI?
No, Instamancer only works from the command-line. In the future, I might implement a GUI using [Carlo](https://github.com/GoogleChromeLabs/carlo) or something more lightweight.

### Do I need to log in?
No. Instamancer scrapes data that Instagram makes publicly available.

### Can I run multiple instances at the same time rather than batch scraping?
No. Instagram will probably rate-limit your IP address and then Instamancer will have to pause until the limit is lifted.

### What happens if I disable grafting?
Chrome / Chromium will eventually decide that it doesn't want the page to consume any more resources and future requests to the API will be aborted. This usually happens between 5k-10k posts regardless of the memory available on the system. There doesn't seem to be any combination of Chrome flags to avoid this.

### How far back can I scrape?
Seemingly as far as there are posts to scrape, but you can only reach old posts by scraping the most recent ones.

### How many posts can I scrape from a given endpoint?
The most I've seen is more than 100,000.

### Can I make it run faster?
Running without the `--full` argument is faster. Reducing the time between interactions with the page only seems to induce rate limiting.

Unfortunately the scraping does not appear to be parallelisable because the pagination between requests doesn't use time codes.

### Why is the maximum number of posts that I'm able to scrape inconsistent?
I'm not certain. This seems to only occur where you are able to gather tens of thousands of posts. I believe it is because of some clandestine IP-based policy that limits the number of requests you can make in a day to a particular endpoint. It could also be a bug in Instamancer.

### Why does the code have so many comments?
Instamancer was originally written in Python and used the [Pyppeteer](https://github.com/miyakogi/pyppeteer) clone of Puppeteer. This version was too error-prone because of the complicated asyncio code and Pyppeteer's instability when communicating over websockets during long scraping jobs. 

I decided to rewrite Instamancer in TypeScript in order to be more stable and in-sync with Puppeter's updates. It was the first time I'd written any serious TypeScript, so the zealous commenting helped me learn, and allowed me to figure out bugs in my algorithm and the grafting process. The comments aren't a permanent fixture and may be removed in a future commit.
