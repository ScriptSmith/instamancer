# FAQ
## Does it still work?
At the time of writing, Instamancer still works. It's possible that it will break when Instagram.com is updated, or Instagram tries to curb this method of scraping.

There is a daily Travis cron job which tests whether Instamancer is working as expected. You can see the results here: [![Build Status](https://travis-ci.com/ScriptSmith/instamancer.svg?token=s9KJfKerUtoC75SEgCjT&branch=master)](https://travis-ci.com/ScriptSmith/instamancer)

## Is there a GUI?
No, Instamancer only works from the command-line. In the future, I might implement a GUI using [Carlo](https://github.com/GoogleChromeLabs/carlo) or something more lightweight.

There is a instagram data exploring tool in development here: [https://github.com/andyepx/insta-explorer](https://github.com/andyepx/insta-explorer)

## Do I need to log in?
No. Instamancer scrapes data that Instagram makes publicly available.

## How quickly does it run?
It can processes anywhere from 3-30 posts per second depending on configuration.

## Can I make it run faster?
Running without the `--full` and `-d` arguments is faster.

Not using `--sync` and customising the `-k` option can make downloading files quicker.

Disabling grafting with `-g=false` will make the scraping quicker at the cost of not being able to access all posts (see [here](#what-happens-if-i-disable-grafting)).

Setting `--sleep` to a decimal number below 1 speeds up page interactions at the cost of stability, as it makes you more likely to be rate limited.

Scraping is not parallelisable (see [here](#can-i-run-multiple-instances-at-the-same-time-rather-than-batch-scraping)).

Using `--plugin LargeFirst` is as much as 5x faster, but may result in undefined behavior.

If you want something *really* fast, try [Instaphyte](https://github.com/ScriptSmith/instaphyte). It's as much as 12x faster.

## Can I run multiple instances at the same time rather than batch scraping?
No. Instagram will probably rate-limit your IP address and then Instamancer will have to pause until the limit is lifted.

## What happens if I disable grafting?
Chrome / Chromium will eventually decide that it doesn't want the page to consume any more resources and future requests to the API will be aborted. This usually happens between 5k-10k posts regardless of the memory available on the system. There doesn't seem to be any combination of Chrome flags to avoid this.

## How far back can I scrape?
Seemingly as far as there are posts to scrape, but you can only reach old posts by scraping the most recent ones.

## How many posts can I scrape from a given endpoint?
The most I've seen is more than 5 million.

## How do I scrape the first posts on the page?

In the default configuration, Instamancer will skip the posts that are pre-loaded on the page. This is because it only retrieves posts generated from API requests, which aren't made for these posts.

If you would like to retrieve these posts, then you should use full mode: `--full` or `-f`.

This behavior may change in the future.

## How do I use the `--bucket` flag and S3?
1. Create an S3 bucket. Find help [here](https://docs.aws.amazon.com/AmazonS3/latest/gsg/CreatingABucket.html).
2. Configure your AWS credentials. Find help [here](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html).
    1. Ensure you can write to S3 with the credentials you're using.
3. Use instamancer like so:

```
instamancer ... -d --bucket=BUCKET_NAME
```

Where `BUCKET_NAME` is the name of the bucket.

Example:

```
instamancer hashtag puppies -c10 -d --bucket=instagram-puppies
```


## How do I use the `--depot` flag and depot?
1. Set up [depot](https://github.com/ScriptSmith/depot)
    1. Set up basic access authentication if you're using a public server
2. Generate a UUIDv4
3. Use instamancer like so:

```
instamancer ... -d --depot=http://127.0.0.1:8080/jobs/UUID/
```

Where `UUID` is the UUID you generated.

Example:

```
instamancer hashtag puppies -c10 -d --depot=https://depot:password@depot-vlnbfvyaiq-uc.a.run.app/jobs/4cdc21fe-6b35-473a-b26e-66f62ad66c4c/
```

You can use any server that accepts `PUT` requests.


## What does a batchfile look like?
```
hashtag spring -d --full
hashtag summer -f=data.json
user greg -c100
```

## Why does the code have so many comments?
Instamancer was originally part of another project written in Python that used the [Pyppeteer](https://github.com/miyakogi/pyppeteer) clone of Puppeteer. This version was too error-prone because of the complicated asyncio code and Pyppeteer's instability when communicating via websockets during long scraping jobs.

I decided to rewrite Instamancer in TypeScript in order to be more stable and in-sync with Puppeteer. It was the first time I'd written any serious TypeScript or 'modern' JavaScript (promises, async/await etc.), so the zealous commenting helped me learn, and allowed me to figure out bugs in my algorithm and the grafting process. The comments aren't a permanent fixture and may be removed in a future commit.
