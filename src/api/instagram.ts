import AwaitLock = require("await-lock");
import chalk from "chalk";
import {isLeft} from "fp-ts/lib/Either";
import {Type} from "io-ts";
import {PathReporter} from "io-ts/lib/PathReporter";
import {ThrowReporter} from "io-ts/lib/ThrowReporter";
import * as _ from "lodash/object";
import {
  Browser,
  Headers,
  launch,
  LaunchOptions,
  Page,
  Request,
  Response,
} from "puppeteer";
import * as winston from "winston";
import {IOptions} from "./api";
import {PostIdSet} from "./postIdSet";

/**
 * Instagram API wrapper
 */
export class Instagram<PostType> {
  /**
   * Apply defaults to undefined options
   */
  private static defaultOptions(options: IOptions) {
    if (options.enableGrafting === undefined) {
      options.enableGrafting = true;
    }
    if (options.fullAPI === undefined) {
      options.fullAPI = false;
    }
    if (options.headless === undefined) {
      options.headless = true;
    }
    if (options.logger === undefined) {
      options.logger = winston.createLogger({
        silent: true,
      });
    }
    if (options.silent === undefined) {
      options.silent = false;
    }
    if (options.sleepTime === undefined) {
      options.sleepTime = 2;
    }
    if (options.hibernationTime === undefined) {
      options.hibernationTime = 60 * 20;
    }
    if (options.total === undefined) {
      options.total = 0;
    }
    return options;
  }

  // Resource identifier
  protected id: string;
  protected url: string;

  // Iteration state
  protected started: boolean = false;
  protected paused: boolean = false;
  protected finished: boolean = false;

  // Instagram URLs
  protected catchURL: string = "https://www.instagram.com/graphql/query";
  protected postURL: string = "https://instagram.com/p/";
  protected defaultPostURL: string = "https://www.instagram.com/p/";

  // Number of jumps before grafting
  protected jumpMod: number = 100;

  // Validations
  private readonly strict: boolean = false;
  private readonly validator: Type<unknown>;

  // Puppeteer state
  private browser: Browser;
  private browserDisconnected: boolean = true;
  private page: Page;
  private readonly headless: boolean;

  // Array of scraped posts and lock
  private postBuffer: PostType[] = [];
  private postBufferLock: AwaitLock = new AwaitLock();

  // Request and Response buffers and locks
  private requestBuffer: Request[] = [];
  private requestBufferLock: AwaitLock = new AwaitLock();
  private responseBuffer: Response[] = [];
  private responseBufferLock: AwaitLock = new AwaitLock();

  // Get full amount of data from API
  private readonly fullAPI: boolean = false;
  private pagePromises: Array<Promise<void>> = [];

  // Grafting state
  private readonly enableGrafting: boolean = true;
  private graft: boolean = false;
  private lastURL: string;
  private lastHeaders: Headers;

  // Hibernation due to rate limiting
  private hibernate: boolean = false;
  private readonly hibernationTime: number = 60 * 20; // 20 minutes

  // Number of jumps before exiting because lack of data
  private failedJumps: number = 10;

  // Strings denoting the access methods of API objects
  private readonly pageQuery: string;
  private readonly edgeQuery: string;

  // Cache of post ids
  private postIds: PostIdSet;

  // Iteration variables
  private readonly total: number;
  private index: number = 0;
  private jumps: number = 0;

  // Number of times to attempt to visit url initially
  private readonly maxPageUrlAttempts = 3;
  private pageUrlAttempts = 0;
  private postPageRetries = 5;

  // Output
  private readonly silent: boolean = false;
  private writeLock: AwaitLock = new AwaitLock();

  // Sleep time remaining
  private sleepRemaining: number = 0;

  // Length of time to sleep for
  private readonly sleepTime: number = 2;

  // Logging object
  private logger: winston.Logger;

  // Proxy for Instagram connection
  private readonly proxyURL: string;

  // Location of chromium / chrome binary executable
  private readonly executablePath: string;

  /**
   * Create API wrapper instance
   * @param endpoint the url for the type of resource to scrape
   * @param id the identifier for the resource
   * @param pageQuery the query to identify future pages in the nested API structure
   * @param edgeQuery the query to identify posts in the nested API structure
   * @param options configuration details
   * @param validator response type validator
   */
  constructor(
    endpoint: string,
    id: string,
    pageQuery: string,
    edgeQuery: string,
    options: IOptions = {},
    validator: Type<unknown>,
  ) {
    this.id = id;
    this.postIds = new PostIdSet();
    this.url = endpoint + id;

    options = Instagram.defaultOptions(options);
    this.total = options.total;
    this.pageQuery = pageQuery;
    this.edgeQuery = edgeQuery;
    this.headless = options.headless;
    this.logger = options.logger;
    this.silent = options.silent;
    this.strict = options.strict;
    this.enableGrafting = options.enableGrafting;
    this.sleepTime = options.sleepTime;
    this.hibernationTime = options.hibernationTime;
    this.fullAPI = options.fullAPI;
    this.proxyURL = options.proxyURL;
    this.executablePath = options.executablePath;
    this.validator = options.validator || validator;
  }

  /**
   * Toggle pausing data collection
   */
  public pause() {
    this.paused = !this.paused;
  }

  /**
   * Toggle prolonged pausing
   */
  public toggleHibernation() {
    this.hibernate = true;
  }

  /**
   * Force the API to stop
   */
  public async forceStop() {
    this.finished = true;
    try {
      this.requestBufferLock.release();
      // tslint:disable-next-line: no-empty
    } catch (e) {}
    try {
      this.responseBufferLock.release();
      // tslint:disable-next-line: no-empty
    } catch (e) {}
    await this.stop();
  }

  /**
   * Generator of posts on page
   */
  public async *generator(): AsyncIterableIterator<PostType> {
    // Start if haven't done so already
    if (!this.started) {
      await this.start();
    }

    while (true) {
      // Get more posts
      await this.getNext();

      // Yield posts from buffer
      let post = await this.postPop();
      while (post) {
        yield post;
        post = await this.postPop();
      }

      // End loop when finished and posts in buffer exhausted
      if (this.finished) {
        break;
      }
    }
    await this.stop();

    // Add newline to end of output
    if (!this.silent) {
      process.stdout.write("\n");
    }
  }

  /**
   * Construct page and add listeners
   */
  public async start() {
    // Build page and visit url
    await this.constructPage();

    this.started = true;

    // Add event listeners for requests and responses
    await this.page.setRequestInterception(true);
    this.page.on("request", (req) => this.interceptRequest(req));
    this.page.on("response", (res) => this.interceptResponse(res));
    this.page.on("requestfailed", (res) => this.interceptFailure(res));

    // Ignore dialog boxes
    this.page.on("dialog", (dialog) => dialog.dismiss());

    // Log errors
    this.page.on("error", (error) => this.logger.error(error));

    // Gather initial posts from web page
    if (this.fullAPI) {
      await this.scrapeDefaultPosts();
    }
  }

  /**
   * Open a post in a new page, then extract its metadata
   */
  protected async postPage(post: string, retries: number) {
    // Create page
    const postPage = await this.browser.newPage();
    await postPage.setRequestInterception(true);
    postPage.on("request", async (req) => {
      if (!req.url().includes("/p/" + post)) {
        await req.abort();
      } else {
        await req.continue();
      }
    });
    postPage.on("requestfailed", async () => undefined);

    // Visit post and read state
    let data;
    let parsed;
    try {
      await postPage.goto(this.postURL + post);

      // Load data from memory
      /* istanbul ignore next */
      data = await postPage.evaluate(() => {
        return JSON.stringify(
          window["_sharedData"].entry_data.PostPage[0].graphql,
        );
      });
      parsed = JSON.parse(data) as PostType;
      await postPage.close();
    } catch (e) {
      // Log error and wait
      this.logger.error(e);
      await this.progress(Progress.ABORTED);
      await this.sleep(2);

      // Close existing attempt
      await postPage.close();

      // Retry
      if (retries > 0) {
        await this.postPage(post, --retries);
      }
    }
    if (!parsed) {
      return;
    }
    await this.addToPostBuffer(parsed);
  }

  /**
   * Stimulate the page until responses gathered
   */
  protected async getNext() {
    await this.progress(Progress.SCRAPING);
    while (true) {
      // Process results (if any)
      await this.processRequests();
      await this.processResponses();

      // Finish page promises
      await this.progress(Progress.BRANCHING);
      await Promise.all(this.pagePromises);
      this.pagePromises = [];

      // Check if finished
      if (this.finished) {
        break;
      }

      // Pause if paused
      await this.waitResume();

      // Interact with page to stimulate request
      await this.jump();

      // Stop if no data is being gathered
      if (this.jumps === this.failedJumps && this.index === 0) {
        this.finished = true;
        break;
      }

      // Enable grafting if required
      if (this.jumps % this.jumpMod === 0) {
        await this.initiateGraft();
      }

      // Sleep
      await this.sleep(this.sleepTime);

      // Hibernate if rate-limited
      if (this.hibernate) {
        await this.sleep(this.hibernationTime);
        this.hibernate = false;
      }

      // Break if posts in buffer
      await this.postBufferLock.acquireAsync();
      const posts = this.postBuffer.length;
      this.postBufferLock.release();
      if (posts > 0) {
        break;
      }
    }
  }

  /**
   * Halt execution
   * @param time Seconds
   */
  protected async sleep(time: number) {
    for (let i = time; i > 0; i--) {
      this.sleepRemaining = i;
      await this.progress(Progress.SCRAPING);
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    }
    this.sleepRemaining = 0;
    await this.progress(Progress.SCRAPING);
  }

  /**
   * Create the browser and page, then visit the url
   */
  private async constructPage() {
    // Browser args
    const args = [];
    if (process.env.NO_SANDBOX) {
      args.push("--no-sandbox");
      args.push("--disable-setuid-sandbox");
    }
    if (this.proxyURL !== undefined) {
      args.push("--proxy-server=" + this.proxyURL);
    }

    // Browser launch options
    const options: LaunchOptions = {
      args,
      headless: this.headless,
    };
    if (this.executablePath !== undefined) {
      options.executablePath = this.executablePath;
    }

    // Launch browser
    await this.progress(Progress.LAUNCHING);
    this.browser = await launch(options);
    this.browserDisconnected = false;
    this.browser.on("disconnected", () => (this.browserDisconnected = true));

    // New page
    this.page = await this.browser.newPage();
    await this.progress(Progress.OPENING);

    // Attempt to visit URL
    try {
      await this.page.goto(this.url);
    } catch (e) {
      // Increment attempts
      if (this.pageUrlAttempts++ === this.maxPageUrlAttempts && !this.started) {
        throw new Error("Failed to visit URL");
      }

      // Log error and wait
      this.logger.error(e);
      this.logger.error(this.url);
      await this.progress(Progress.ABORTED);
      await this.sleep(60);

      // Close existing attempt
      await this.page.close();
      await this.browser.close();

      // Retry
      await this.constructPage();
    }
  }

  /**
   * Close the page and browser
   */
  private async stop() {
    await this.progress(Progress.CLOSING);

    // Close page and browser
    if (!this.page.isClosed()) {
      await this.page.close();
    }
    if (!this.browserDisconnected) {
      await this.browser.close();
    }

    // Clear request buffers
    await this.requestBufferLock.acquireAsync();
    this.requestBuffer = [];
    this.requestBufferLock.release();

    // Clear response buffers
    await this.responseBufferLock.acquireAsync();
    this.responseBuffer = [];
    this.responseBufferLock.release();
  }

  /**
   * Pause and wait until resumed
   */
  private async waitResume() {
    // Pause for 200 milliseconds
    function f() {
      return new Promise((resolve) => {
        setTimeout(resolve, 200);
      });
    }

    // Pause until pause toggled
    while (this.paused === true) {
      await this.progress(Progress.PAUSED);
      await f();
    }
  }

  /**
   * Pop a post off the postBuffer (using locks). Returns null if no posts in buffer
   */
  private async postPop() {
    let post = null;
    await this.postBufferLock.acquireAsync();
    if (this.postBuffer.length > 0) {
      post = this.postBuffer.shift();
    }
    this.postBufferLock.release();
    return post;
  }

  /**
   * Match the url to the url used in API requests
   */
  private matchURL(url: string) {
    return url.startsWith(this.catchURL) && !url.includes("include_reel");
  }

  /**
   * Print progress to stdout
   */
  private async progress(state: Progress) {
    // End if silent
    if (this.silent) {
      return;
    }

    // Lock
    await this.writeLock.acquireAsync();

    // Calculate total
    const total = this.total === 0 ? "Unlimited" : this.total;

    // Generate output string
    const idStr = chalk.bgYellow.black(` ${this.id} `);
    const totalStr = chalk.bgBlack(` Total: ${total} `);
    const stateStr = chalk.bgWhite.black(` State: ${state} `);
    const sleepStr = chalk.bgWhite.black(` Sleeping: ${this.sleepRemaining} `);
    const indexStr = chalk.bgWhite.black(` Scraped: ${this.index} `);

    const out = `${idStr}${totalStr}${stateStr}${sleepStr}${indexStr}`;
    this.logger.debug(out);

    // Print output
    process.stdout.write("\r" + out + "\u001B[K");

    // Release
    this.writeLock.release();
  }

  /**
   * Add request to the request buffer
   */
  private async interceptRequest(req: Request) {
    await this.requestBufferLock.acquireAsync();
    this.requestBuffer.push(req);
    await this.requestBufferLock.release();
  }

  /**
   * Add the response to the response buffer
   */
  private async interceptResponse(res: Response) {
    await this.responseBufferLock.acquireAsync();
    this.responseBuffer.push(res);
    await this.responseBufferLock.release();
  }

  /**
   * Log failed requests
   */
  private async interceptFailure(req: Request) {
    this.logger.info("Failed: " + req.url());
    await this.progress(Progress.ABORTED);
  }

  /**
   * Process the requests in the request buffer
   */
  private async processRequests() {
    await this.requestBufferLock.acquireAsync();

    for (const req of this.requestBuffer) {
      // Match url
      if (!this.matchURL(req.url())) {
        continue;
      }

      // Switch url and headers if grafting enabled, else store them
      let reqURL = req.url();
      let reqHeaders = req.headers();
      if (this.graft) {
        reqURL = this.lastURL;
        reqHeaders = this.lastHeaders;
      } else {
        this.lastURL = req.url();
        this.lastHeaders = req.headers();
      }

      // Get response
      await req.continue({
        headers: reqHeaders,
        url: reqURL,
      });
    }

    // Clear buffer and release
    this.requestBuffer = [];
    this.requestBufferLock.release();
  }

  /**
   * Process the responses in the response buffer
   */
  private async processResponses() {
    await this.responseBufferLock.acquireAsync();

    let disableGraft = false;
    for (const res of this.responseBuffer) {
      // Match url
      if (!this.matchURL(res.url())) {
        continue;
      } else {
        disableGraft = true;
      }

      // Get JSON data
      let data: JSON;
      try {
        data = await res.json();
      } catch (e) {
        this.logger.error("Error processing response JSON");
        this.logger.error(e);
      }

      // Check for rate limiting
      if (data && "status" in data && data["status"] === "fail") {
        this.logger.info("Rate limited");
        this.hibernate = true;
        continue;
      }

      // Check for next page
      if (
        !(
          _.get(data, this.pageQuery + ".has_next_page", false) &&
          _.get(data, this.pageQuery + ".end_cursor", false)
        )
      ) {
        this.logger.info("No posts remaining");
        this.finished = true;
      }

      // Get posts
      const posts: PostType[] = _.get(data, this.edgeQuery, []);
      for (const post of posts) {
        const postId = post["node"]["id"];

        // Check it hasn't already been cached
        const contains = this.postIds.add(postId);
        if (contains) {
          this.logger.info("Duplicate id found: " + postId);
          continue;
        }

        // Add to postBuffer
        if (this.index < this.total || this.total === 0) {
          this.index++;
          if (this.fullAPI) {
            this.pagePromises.push(
              this.postPage(post["node"]["shortcode"], this.postPageRetries),
            );
          } else {
            await this.addToPostBuffer(post);
          }
        } else {
          this.finished = true;
          break;
        }
      }
    }

    // Switch off grafting if enabled and responses processed
    if (this.graft && disableGraft) {
      this.graft = false;
    }

    // Clear buffer and release
    this.responseBuffer = [];
    this.responseBufferLock.release();
  }

  /**
   * Add post to buffer
   */
  private async addToPostBuffer(post: PostType) {
    await this.postBufferLock.acquireAsync();
    this.validatePost(post);
    this.postBuffer.push(post);
    this.postBufferLock.release();
  }

  private validatePost(post: PostType) {
    const validationResult = this.validator.decode(post);
    if (this.strict) {
      try {
        ThrowReporter.report(validationResult);
      } catch (e) {
        this.forceStop();
        throw e;
      }
      return;
    }
    if (isLeft(validationResult)) {
      const validationReporter = PathReporter.report(validationResult);
      this.logger.warn(
        `
      Warning! The Instagram API has been changed since this version of instamancer was released.
      More info: https://scriptsmith.github.io/instamancer/api-change
      `,
        validationReporter,
      );
    }
  }

  /**
   * Manipulate the page to stimulate a request
   */
  private async jump() {
    await this.page.keyboard.press("PageUp");
    await this.page.keyboard.press("End");
    await this.page.keyboard.press("End");

    // Move mouse randomly
    const width = this.page.viewport()["width"];
    const height = this.page.viewport()["height"];
    await this.page.mouse.move(
      Math.round(width * Math.random()),
      Math.round(height * Math.random()),
    );

    ++this.jumps;
  }

  /**
   * Clear request and response buffers
   */
  private async initiateGraft() {
    // Check if enabled
    if (!this.enableGrafting) {
      return;
    }

    await this.progress(Progress.GRAFTING);

    // Close browser and page
    await this.stop();

    // Enable grafting
    this.graft = true;

    // Re-start page
    await this.start();
  }

  /**
   * Read the posts that are pre-loaded on the page
   */
  private async scrapeDefaultPosts() {
    // Get shortcodes from page
    /* istanbul ignore next */
    const shortCodes = await this.page.evaluate((url) => {
      return Array.from(document.links)
        .filter((link) => {
          return link.href.startsWith(url) && link.href.split("/").length >= 2;
        })
        .map((link) => {
          const linkSplit = link.href.split("/");
          return linkSplit[linkSplit.length - 2];
        });
    }, this.defaultPostURL);

    // Add postPage promises
    for (const shortCode of shortCodes) {
      if (this.index < this.total || this.total === 0) {
        this.index++;
        this.pagePromises.push(this.postPage(shortCode, this.postPageRetries));
      } else {
        this.finished = true;
        break;
      }
    }
  }
}

/**
 * The states of progress that the API can be in. Used to output status.
 */
enum Progress {
  LAUNCHING = "Launching",
  OPENING = "Navigating",
  SCRAPING = "Scraping",
  BRANCHING = "Branching",
  GRAFTING = "Grafting",
  CLOSING = "Closing",

  PAUSED = "Paused",
  ABORTED = "Request aborted",
}
