import AwaitLock from "await-lock";
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
import {
    AsyncPluginEventsType,
    IPlugin,
    IPluginContext,
    PluginEventsType,
    SyncPluginEvents,
    SyncPluginEventsType,
} from "../../plugins";
import {IOptions} from "./api";
import {PostIdSet} from "./postIdSet";

type AsyncPluginFunctions = {
    [key in AsyncPluginEventsType]: ((...args: any[]) => Promise<void>)[];
};
type SyncPluginFunctions = {
    [key in SyncPluginEventsType]: ((...args: any[]) => void)[];
};
type PluginFunctions = AsyncPluginFunctions & SyncPluginFunctions;

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
        if (options.sameBrowser === undefined) {
            options.sameBrowser = false;
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
            options.silent = true;
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
    public id: string;
    public url: string;

    // Iteration state
    public started: boolean = false;
    public paused: boolean = false;
    public finished: boolean = false;

    // Instagram URLs
    public catchURL: string = "https://www.instagram.com/graphql/query";
    public postURL: string = "https://instagram.com/p/";
    public defaultPostURL: string = "https://www.instagram.com/p/";

    // Number of jumps before grafting
    public jumpMod: number = 100;

    // Depth of jumps
    public jumpSize: number = 2;

    // Puppeteer resources
    public page: Page;

    // Logging object
    public logger: winston.Logger;

    // Validations
    private readonly strict: boolean = false;
    private readonly validator: Type<unknown>;

    // Puppeteer state
    private browser: Browser;
    private browserDisconnected: boolean = true;
    /** Browser instance passed from outside */
    private readonly browserInstance?: Browser;
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
    private pagePromises: Promise<void>[] = [];

    // Grafting state
    private readonly enableGrafting: boolean = true;
    private readonly sameBrowser: boolean = false;
    private graft: boolean = false;
    private graftURL: string = null;
    private graftHeaders: Headers = null;
    private foundGraft: boolean = false;

    // Hibernation due to rate limiting
    private hibernate: boolean = false;
    private readonly hibernationTime: number = 60 * 20; // 20 minutes

    // Number of jumps before exiting because lack of data
    private failedJumps: number = 20;
    private responseFromAPI: boolean = false;

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

    // Proxy for Instagram connection
    private readonly proxyURL: string;

    // Location of chromium / chrome binary executable
    private readonly executablePath: string;

    // Plugins to be run
    private pluginFunctions: PluginFunctions = {
        browser: [],
        construction: [],
        grafting: [],
        postPage: [],
        request: [],
        response: [],
    };

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
        this.url = endpoint.replace("[id]", id);

        options = Instagram.defaultOptions(options);
        this.total = options.total;
        this.pageQuery = pageQuery;
        this.edgeQuery = edgeQuery;
        this.browserInstance = options.browserInstance;
        this.headless = options.headless;
        this.logger = options.logger;
        this.silent = options.silent;
        this.strict = options.strict;
        this.enableGrafting = options.enableGrafting;
        this.sameBrowser = options.sameBrowser;
        this.sleepTime = options.sleepTime;
        this.hibernationTime = options.hibernationTime;
        this.fullAPI = options.fullAPI;
        this.proxyURL = options.proxyURL;
        this.executablePath = options.executablePath;
        this.validator = options.validator || validator;

        this.addPlugins(options["plugins"]);
        this.executePlugins("construction");
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
    public async forceStop(force?: boolean) {
        if (!force && !this.started) {
            return;
        }
        this.started = false;
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
        await this.executePlugins("browser");

        this.started = true;

        // Add event listeners for requests and responses
        await this.page.setRequestInterception(true);
        this.page.on("request", (req) => this.interceptRequest(req));
        this.page.on("response", (res) => this.interceptResponse(res));
        this.page.on("requestfailed", (res) => this.interceptFailure(res));
        this.page.on("console", (message) =>
            this.logger.info("Console log", message),
        );

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
     * Match the url to the url used in API requests
     */
    public matchURL(url: string) {
        return url.startsWith(this.catchURL) && !url.includes("include_reel");
    }

    /**
     * Close the page and browser
     */
    protected async stop() {
        await this.progress(Progress.CLOSING);

        // Remove listeners
        if (!this.page.isClosed()) {
            this.page.removeAllListeners("request");
            this.page.removeAllListeners("response");
            this.page.removeAllListeners("requestfailed");
        }

        // Clear request buffers
        await this.requestBufferLock.acquireAsync();
        this.requestBuffer = [];
        this.requestBufferLock.release();

        // Clear response buffers
        await this.responseBufferLock.acquireAsync();
        this.responseBuffer = [];
        this.responseBufferLock.release();

        // Close page
        if (!this.page.isClosed()) {
            await this.page.close();
        }

        if (
            this.finished &&
            !this.browserDisconnected &&
            !this.browserInstance
        ) {
            await this.browser.close();
        }
    }

    /**
     * Process the requests in the request buffer
     */
    protected async processRequests() {
        await this.requestBufferLock.acquireAsync();

        let newApiRequest = false;
        for (const req of this.requestBuffer) {
            // Match url
            if (!this.matchURL(req.url())) {
                continue;
            } else {
                newApiRequest = true;
            }

            // Begin grafting if required, else continue the request
            if (this.graft) {
                if (this.foundGraft === false) {
                    // Gather details
                    this.graftURL = req.url();
                    this.graftHeaders = req.headers();
                    this.foundGraft = true;

                    // Cancel request
                    await req.abort();
                } else {
                    // Swap request
                    const overrides = {
                        headers: this.graftHeaders,
                        url: this.graftURL,
                    };
                    await this.executePlugins("request", req, overrides);
                    await req.continue(overrides);

                    // Reset grafting data
                    this.graft = false;
                    this.foundGraft = false;
                    this.graftURL = null;
                    this.graftHeaders = null;
                }

                // Stop reading requests
                break;
            } else {
                const overrides = {};
                this.executePlugins("request", req, overrides);
                await req.continue(overrides);
            }
        }

        // Clear buffer and release
        this.requestBuffer = [];
        this.requestBufferLock.release();

        if (this.foundGraft && newApiRequest) {
            // Restart browser and page, clearing all buffers
            await this.stop();
            await this.start();
        }
    }

    /**
     * Process the responses in the response buffer
     */
    protected async processResponses() {
        await this.responseBufferLock.acquireAsync();

        for (const res of this.responseBuffer) {
            // Match url
            if (!this.matchURL(res.url())) {
                continue;
            }

            // Acknowlege receipt of response
            this.responseFromAPI = true;

            // Get JSON data
            let data: unknown;
            try {
                data = await res.json();
                if (typeof data !== "object") {
                    throw new Error("Response data is not an object");
                }
            } catch (e) {
                this.logger.error("Error processing response JSON");
                this.logger.error(e);
                continue;
            }

            // Emit event
            this.executePlugins("response", res, data);

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
                this.logger.info("No posts remaining", {data});
                this.finished = true;
            }

            await this.processResponseData(data);
        }

        // Clear buffer and release
        this.responseBuffer = [];
        this.responseBufferLock.release();
    }

    protected async processResponseData(data: unknown) {
        // Get posts
        const posts = _.get(data, this.edgeQuery, []);
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
                        this.postPage(
                            post["node"]["shortcode"],
                            this.postPageRetries,
                        ),
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
        await this.executePlugins("postPage", parsed);
        await this.addToPostBuffer(parsed);
    }

    protected async validatePost(post: PostType) {
        const validationResult = this.validator.decode(post);
        if (this.strict) {
            try {
                ThrowReporter.report(validationResult);
            } catch (e) {
                await this.forceStop();
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
                {validationReporter, post},
            );
        }
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
            if (this.pagePromises.length > 0) {
                await this.progress(Progress.BRANCHING);
                await Promise.all(this.pagePromises);
                this.pagePromises = [];
            }

            // Check if finished
            if (this.finished) {
                break;
            }

            // Pause if paused
            await this.waitResume();

            // Interact with page to stimulate request
            await this.jump();

            // Stop if no data is being gathered
            if (this.jumps === this.failedJumps) {
                if (this.fullAPI) {
                    if (!this.responseFromAPI) {
                        this.finished = true;
                    }
                } else if (this.index === 0) {
                    this.finished = true;

                    const pageContent = {content: ""};
                    try {
                        pageContent.content = await this.page.content();
                    } catch (e) {
                        // No content
                    }

                    this.logger.error(
                        "Page failed to make requests",
                        pageContent,
                    );
                    break;
                }
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
                setTimeout(resolve, i >= 1 ? 1000 : i * 1000);
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
        if (this.browserInstance) {
            await this.progress(Progress.LAUNCHING);
            this.browser = this.browserInstance;
            this.browserDisconnected = !this.browser.isConnected();
            this.browser.on(
                "disconnected",
                () => (this.browserDisconnected = true),
            );
        } else if (!this.sameBrowser || (this.sameBrowser && !this.started)) {
            await this.progress(Progress.LAUNCHING);
            this.browser = await launch(options);
            this.browserDisconnected = false;
            this.browser.on(
                "disconnected",
                () => (this.browserDisconnected = true),
            );
        }

        // New page
        this.page = await this.browser.newPage();
        await this.progress(Progress.OPENING);

        // Attempt to visit URL
        try {
            await this.page.goto(this.url);

            // Fix issue with disabled scrolling
            /* istanbul ignore next */
            await this.page.evaluate(() => {
                setInterval(() => {
                    try {
                        document.body.style.overflow = "";
                    } catch (e) {
                        // tslint:disable-next-line:no-console
                        console.log("Failed to update style");
                        // tslint:disable-next-line:no-console
                        console.error(e.message);
                    }
                }, 10000);
            });
        } catch (e) {
            // Increment attempts
            if (
                this.pageUrlAttempts++ === this.maxPageUrlAttempts &&
                !this.started
            ) {
                await this.forceStop(true);
                throw new Error("Failed to visit URL");
            }

            // Log error and wait
            this.logger.error("Error", e);
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
     * Print progress to stderr
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
        const sleepStr = chalk.bgWhite.black(
            ` Sleeping: ${this.sleepRemaining} `,
        );
        const indexStr = chalk.bgWhite.black(` Scraped: ${this.index} `);

        this.logger.debug({
            id: this.id,
            index: this.index,
            sleepRemaining: this.sleepRemaining,
            state,
            total,
        });

        // Print output
        process.stderr.write(
            `\r${idStr}${totalStr}${stateStr}${sleepStr}${indexStr}\u001B[K`,
        );

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
     * Add post to buffer
     */
    private async addToPostBuffer(post: PostType) {
        await this.postBufferLock.acquireAsync();
        await this.validatePost(post);
        this.postBuffer.push(post);
        this.postBufferLock.release();
    }

    /**
     * Manipulate the page to stimulate a request
     */
    private async jump() {
        await this.page.keyboard.press("PageUp");
        const jumpSize = this.graft ? 1 : this.jumpSize;
        for (let i = 0; i < jumpSize; i++) {
            await this.page.keyboard.press("End");
        }

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

        this.executePlugins("grafting");

        // Enable grafting
        this.graft = true;
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
                    return (
                        link.href.startsWith(url) &&
                        link.href.split("/").length >= 2
                    );
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
                this.pagePromises.push(
                    this.postPage(shortCode, this.postPageRetries),
                );
            } else {
                this.finished = true;
                break;
            }
        }
    }

    private addPlugins(plugins: IPlugin<PostType>[]) {
        if (!plugins) {
            return;
        }

        for (const plugin of plugins) {
            for (const event of Object.keys(this.pluginFunctions)) {
                const pluginEvent = plugin[event + "Event"];
                if (pluginEvent) {
                    const context: IPluginContext<typeof plugin, PostType> = {
                        plugin,
                        state: this,
                    };

                    this.pluginFunctions[event].push(pluginEvent.bind(context));
                }
            }
        }
    }

    private executePlugins(event: SyncPluginEventsType, ...args): void;
    private executePlugins(
        event: AsyncPluginEventsType,
        ...args
    ): Promise<unknown>;
    private executePlugins(event: PluginEventsType, ...args) {
        if (event in SyncPluginEvents) {
            for (const pluginFunction of this.pluginFunctions["construction"]) {
                pluginFunction();
            }
            return;
        }

        return Promise.all(
            // @ts-ignore
            this.pluginFunctions[event].map((cb) => cb(...args)),
        );
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
