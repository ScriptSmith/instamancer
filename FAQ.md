# FAQ
## Does it still work?
At the time of writing, Instamancer still works. It's possible that it will break when Instagram.com is updated, or Instagram tries to curb this method of scraping.

There is a daily Travis cron job which tests whether Instamancer is working as expected. You can see the results here: [![Build Status](https://travis-ci.com/ScriptSmith/instamancer.svg?token=s9KJfKerUtoC75SEgCjT&branch=master)](https://travis-ci.com/ScriptSmith/instamancer) 

## Is there a GUI?
No, Instamancer only works from the command-line. In the future, I might implement a GUI using [Carlo](https://github.com/GoogleChromeLabs/carlo) or something more lightweight.

## Do I need to log in?
No. Instamancer scrapes data that Instagram makes publicly available.

## How quickly does it run?
It processes between 2-3 posts per second. 

## Can I make it run faster?
Running without the `--full` and `-d` arguments is faster. Disabling grafting with `-g=false` will also make the scraping quicker.

Reducing the time between interactions with the page only seems to induce rate limiting. Additionally, scraping does not appear to be parallelisable because the pagination between requests doesn't use time codes.

If you want something *really* fast, try [Instaphyte](https://github.com/ScriptSmith/instaphyte). It's as much as 7x faster.

## Can I run multiple instances at the same time rather than batch scraping?
No. Instagram will probably rate-limit your IP address and then Instamancer will have to pause until the limit is lifted.

## What happens if I disable grafting?
Chrome / Chromium will eventually decide that it doesn't want the page to consume any more resources and future requests to the API will be aborted. This usually happens between 5k-10k posts regardless of the memory available on the system. There doesn't seem to be any combination of Chrome flags to avoid this.

## How far back can I scrape?
Seemingly as far as there are posts to scrape, but you can only reach old posts by scraping the most recent ones.

## How many posts can I scrape from a given endpoint?
The most I've seen is more than 100,000.

## What does a batchfile look like?
```
hashtag spring -d --full
hashtag summer -f=data.json
user greg -c100
```

## Why is the maximum number of posts that I'm able to scrape inconsistent?
I'm not certain. This seems to only occur where you are able to gather tens of thousands of posts. I believe it is because of some clandestine IP-based policy that limits the number of requests you can make in a day to a particular endpoint. It could also be a bug in Instamancer.

## Why does the code have so many comments?
Instamancer was originally part of another project written in Python that used the [Pyppeteer](https://github.com/miyakogi/pyppeteer) clone of Puppeteer. This version was too error-prone because of the complicated asyncio code and Pyppeteer's instability when communicating via websockets during long scraping jobs. 

I decided to rewrite Instamancer in TypeScript in order to be more stable and in-sync with Puppeter. It was the first time I'd written any serious TypeScript or 'modern' JavaScript (promises, async/await etc.), so the zealous commenting helped me learn, and allowed me to figure out bugs in my algorithm and the grafting process. The comments aren't a permanent fixture and may be removed in a future commit.

## Instagram API has been changed
Instamancer is working with a pure not-public Instagram API, which can be changed at any moment without prior notice. 

If you see this warning, you can:

- Check the library for updates, maybe a new version has been already released.
- Look for the issue in [open issues](https://github.com/ScriptSmith/instamancer/issues). Maybe somebody is already working on the fix.
- Open a [new Issue](https://github.com/ScriptSmith/instamancer/issues/new/choose)
- Create a fork of the repository and [fix the typings](https://github.com/ScriptSmith/instamancer/blob/master/utils/validation-generator/README.md#fix-typings) by yourself
