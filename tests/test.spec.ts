import * as t from "io-ts";
import {launch, Overrides, Request} from "puppeteer";
import * as winston from "winston";
import {createApi, IPlugin} from "..";
import {plugins} from "..";
import {IPluginContext} from "../plugins";
import {IOptions, IOptionsFullApi} from "../src/api/api";
import {FakePage, IFakePageOptions} from "./__fixtures__/FakePage";
import {QuickGraft} from "./__fixtures__/QuickGraft";
import {startServer, stopServer} from "./server";

jest.setTimeout(8 * 60 * 1000);
/* tslint:disable:no-console */

const hashtags = ["beach", "gym", "puppies", "party", "throwback"];
const users = ["snoopdogg", "arianagrande", "bbc", "whitehouse", "australia"];
const posts = [
    "By54GDoHGzK",
    "Be3rTNplCHf",
    "BlBvw2_jBKp",
    "Bzi33wDnxOz",
    "BfzEfy-lK1N",
    "Bneu_dCHVdn",
    "Brx-adXA9C1",
    "Bz5flRagYQt",
    "BmRZH7NFwi6",
    "BpiIJCUnYwy",
];

let smallSize = 10;
let mediumSize = 100;
let largeSize = 1000;

// Run faster unless executing in CI
if (!process.env.TRAVIS) {
    smallSize /= 10;
    mediumSize /= 10;
    largeSize /= 10;
}

const browserPath = process.env.CHROME
    ? process.env.CHROME
    : "/usr/bin/google-chrome-stable";

// Name of an account with 0 posts to test graceful exit
const emptyAccountName = "emptyaccount";

const createLogger = () =>
    winston.createLogger({
        format: winston.format.json(),
        level: "debug",
        silent: false,
        transports: [
            new winston.transports.File({
                filename: "instamancer_tests.log",
                level: "debug",
            }),
            new winston.transports.Console({
                level: "error",
            }),
        ],
    });

const libraryTestOptions: IOptions = {
    logger: createLogger(),
    silent: true,
    strict: true,
    total: 10,
};

/**
 * Used to debug stalled builds in travis
 * @param name Test name
 * @param callback Test function
 */
function testWrapper(name: string, callback: () => Promise<void>) {
    test(name, async () => {
        if (process.env.TRAVIS) {
            console.log(`Testing ${name}`);
        }
        await callback();
    });
}

describe("Library Classes", () => {
    const total = 10;
    const objects = {
        hashtag: createApi("hashtag", hashtags[0], libraryTestOptions),
        post: createApi("post", posts, libraryTestOptions),
        user: createApi("user", users[0], libraryTestOptions),
    };

    for (const [key, object] of Object.entries(objects)) {
        testWrapper(key, async () => {
            const scraped = [];
            for await (const post of object.generator()) {
                expect(post).toBeDefined();
                scraped.push(post);
            }
            expect(scraped.length).toBe(total);
        });
    }
});

describe("Library Functions", () => {
    const total = 10;
    const generators = {
        hashtag: createApi(
            "hashtag",
            hashtags[0],
            libraryTestOptions,
        ).generator(),
        post: createApi("post", posts, libraryTestOptions).generator(),
        user: createApi("user", users[0], libraryTestOptions).generator(),
    };

    for (const [key, generator] of Object.entries(generators)) {
        testWrapper(key, async () => {
            const scraped = [];
            for await (const post of generator) {
                expect(post).toBeDefined();
                scraped.push(post);
            }
            expect(scraped.length).toBe(total);
        });
    }
});

describe("Full API", () => {
    const total = 10;
    const fullApiOption: IOptionsFullApi = {
        ...libraryTestOptions,
        fullAPI: true,
    };
    const generators = {
        hashtag: createApi("hashtag", hashtags[0], fullApiOption).generator(),
        post: createApi("post", posts, fullApiOption).generator(),
        user: createApi("user", users[0], fullApiOption).generator(),
    };

    for (const [key, generator] of Object.entries(generators)) {
        testWrapper(key, async () => {
            const scraped = [];
            for await (const post of generator) {
                expect(post).toBeDefined();
                scraped.push(post);
            }
            expect(scraped.length).toBe(total);
        });
    }
});

testWrapper("Account with < 10 photos", async () => {
    // This is a not well-known account and it can be deleted at any moment
    // If this test starts to fail, need to find another user
    // which has less then 10 photos
    const id = "zhiznizmelochei";
    const fullApiOption: IOptionsFullApi = {
        ...libraryTestOptions,
        fullAPI: true,
    };
    const api = createApi("user", id, fullApiOption);
    const scraped = [];
    for await (const post of api.generator()) {
        expect(post).toBeDefined();
        scraped.push(post);
    }
    expect(scraped.length).toBeGreaterThan(0);
    // If this user will start to do new posts
    // Need to find a new one
    expect(scraped.length).toBeLessThan(10);
});

describe("API limits", () => {
    class ApiTestConditions {
        public api: "hashtag" | "user";
        public ids: string[];
        public sizes: number[];

        constructor(api: "hashtag" | "user", ids: string[], sizes: number[]) {
            this.api = api;
            this.ids = ids;
            this.sizes = sizes;
        }
    }

    const endpoints: ApiTestConditions[] = [
        new ApiTestConditions("hashtag", hashtags, [largeSize]),
        new ApiTestConditions("user", users, [mediumSize]),
    ];

    for (const endpoint of endpoints) {
        // Get params
        const sourceApi = endpoint.api;
        const ids = endpoint.ids;
        const sizes = endpoint.sizes;

        for (const size of sizes) {
            // Decide how many ids to test based on size
            let sizeIds;
            let splitLen = 5;
            if (size === mediumSize) {
                splitLen = 3;
            } else if (size === largeSize) {
                splitLen = 1;
            }
            sizeIds = ids.slice(0, splitLen);

            for (const id of sizeIds) {
                testWrapper(`${endpoint.api} ${id} ${size}`, async () => {
                    // Specify API options
                    const options: IOptions = {
                        enableGrafting: true,
                        fullAPI: false,
                        headless: true,
                        logger: createLogger(),
                        silent: false,
                        sleepTime: 2,
                        strict: true,
                        total: size,
                    };

                    // Create API
                    const api = createApi(sourceApi, id, options);

                    // Get posts
                    const scraped = [];
                    const postIds = new Set();
                    for await (const post of api.generator()) {
                        postIds.add(post.node.id);
                        scraped.push(post);
                    }

                    // Assert sizes
                    expect(scraped.length).toBe(size);

                    // Check duplicates
                    expect(scraped.length).toBe(postIds.size);
                });
            }
        }
    }
});

describe("API options", () => {
    const hashtagId = "vetinari";
    const total = 50;
    const optionsCollection: [string, IOptions][] = [
        ["No options", {}],
        ["Silence", {silent: true, total}],
        ["Sleep", {sleepTime: 5, total}],
        ["Headless", {headless: false, total}],
        ["Grafting", {enableGrafting: false, total}],
        ["Executable path", {executablePath: browserPath, total}],
        ["Full api", {fullAPI: true, total}],
        ["Limited full api", {fullAPI: true, total: 5}],
    ];

    for (const [index, [name, options]] of optionsCollection.entries()) {
        testWrapper(name, async () => {
            // @ts-ignore
            const tag = createApi("hashtag", hashtagId, options);
            const scraped = [];

            for await (const post of tag.generator()) {
                expect(post).toBeDefined();
                scraped.push(post);
            }

            if (index === 0) {
                expect(scraped.length).toBeGreaterThan(total);
            } else if (index === optionsCollection.length - 1) {
                expect(scraped.length).toBe(5);
            } else {
                expect(scraped.length).toBe(total);
            }
        });
    }
});

describe("Unusual behavior", () => {
    testWrapper("Empty page", async () => {
        const user = createApi("user", emptyAccountName, {}).generator();
        const userPosts = [];
        for await (const post of user) {
            userPosts.push(post);
        }
        expect(userPosts.length).toBe(0);
    });

    testWrapper("No grafting", async () => {
        const total = 100;
        const hashtag = hashtags[0];
        const api = new QuickGraft(hashtag, {total, enableGrafting: false});
        const scraped = [];

        for await (const post of api.generator()) {
            scraped.push(post);
        }

        expect(scraped.length).toBe(total);
    });

    testWrapper("Pausing", async () => {
        const api = createApi("hashtag", hashtags[0], {total: 100});
        const iterator = api.generator();

        api.pause();
        setTimeout(() => {
            api.pause();
        }, 20000);

        for await (const post of iterator) {
            expect(post).toBeDefined();
        }
    });

    testWrapper("Hibernation", async () => {
        const options: IOptions = {
            hibernationTime: 10,
            total: smallSize,
        };

        const api = createApi("hashtag", hashtags[0], options);
        const iterator = api.generator();

        await iterator.next();
        api.toggleHibernation();

        for await (const post of iterator) {
            expect(post).toBeDefined();
        }
    });

    testWrapper("Sandbox", async () => {
        process.env["NO_SANDBOX"] = "true";
        for await (const post of createApi(
            "hashtag",
            hashtags[0],
            libraryTestOptions,
        ).generator()) {
            expect(post).toBeDefined();
        }
        process.env["NO_SANDBOX"] = "";
    });

    testWrapper("Failed Page visit", async () => {
        const options: IOptions = {
            proxyURL: "127.0.0.1:9999",
        };
        const api = createApi("hashtag", hashtags[0], options);
        const scraped = [];

        try {
            for await (const post of api.generator()) {
                scraped.push(post);
            }
        } catch (e) {
            expect(e).toBeDefined();
        }

        expect(scraped.length).toBe(0);
    });
});

describe("Network and API issues", () => {
    async function testOptions(options: IFakePageOptions) {
        options.port = await startServer();
        const api = new FakePage(options);
        const mock = jest.fn();

        try {
            for await (const post of api.generator()) {
                mock(post);
            }
        } catch (e) {
            expect(e).toBeDefined();
        }
        await api.forceStop();

        await stopServer();
    }

    testWrapper("Rate limit", async () => {
        await testOptions({
            catchPage: "rate_limit",
            options: {hibernationTime: 10},
        });
    });

    testWrapper("Invalid JSON", async () => {
        await testOptions({catchPage: "invalid_json"});
    });

    testWrapper("Non object", async () => {
        await testOptions({catchPage: "non_object"});
    });

    testWrapper("No next page", async () => {
        await testOptions({catchPage: "no_next_page", pageQuery: "data"});
    });

    testWrapper("Duplicate post ids", async () => {
        await testOptions({
            catchPage: "duplicate_ids",
            edgeQuery: "data.edges",
            pageQuery: "data",
        });
    });

    testWrapper("Invalid post id", async () => {
        await testOptions({
            catchPage: "invalid_id",
            edgeQuery: "data.edges",
            options: {fullAPI: true, total: 1},
            pageQuery: "data",
        });
    });
});

describe("Strict mode", () => {
    const failingValidator = t.type({
        foo: t.string,
    });

    testWrapper(
        "Should fire warning if strict is false and validations are different",
        async () => {
            const logger = createLogger();
            logger.warn = jest.fn();
            const iterator = createApi("hashtag", hashtags[0], {
                logger,
                strict: false,
                total: 1,
                validator: failingValidator,
            }).generator();

            let i = 0;
            for await (const post of iterator) {
                i++;
                expect(logger.warn).toBeCalledTimes(i);
            }
        },
    );

    testWrapper(
        "Should not fire warning if strict is false and validations are ok",
        async () => {
            const logger = createLogger();
            logger.warn = jest.fn();
            const iterator = createApi("hashtag", hashtags[0], {
                logger,
                strict: false,
                total: 1,
            }).generator();

            for await (const post of iterator) {
                expect(logger.warn).toBeCalledTimes(0);
            }
        },
    );

    testWrapper(
        "Should throw validation error if strict is true and types are incorrect",
        async () => {
            expect.hasAssertions();
            const iterator = createApi("hashtag", hashtags[0], {
                strict: true,
                total: 1,
                validator: failingValidator,
            }).generator();

            try {
                await iterator.next();
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect(e.message).toMatch(/^Invalid value/);
            }
        },
    );

    testWrapper(
        "Should throw validation error if strict is true and types are incorrect (Post)",
        async () => {
            expect.hasAssertions();
            const iterator = createApi("post", posts, {
                strict: true,
                total: 1,
                validator: failingValidator,
            }).generator();

            try {
                await iterator.next();
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect(e.message).toMatch(/^Invalid value/);
            }
        },
    );

    testWrapper(
        "Should throw validation error if strict is true and types are incorrect (Full Mode)",
        async () => {
            expect.hasAssertions();
            const iterator = createApi("hashtag", hashtags[0], {
                fullAPI: true,
                strict: true,
                total: 1,
                validator: failingValidator,
            }).generator();

            try {
                await iterator.next();
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect(e.message).toMatch(/^Invalid value/);
            }
        },
    );
});

describe("Search", () => {
    testWrapper("Search Result Users", async () => {
        const result = await createApi(
            "search",
            "therock",
            libraryTestOptions,
        ).get();
        expect(result.users.length).toBeGreaterThan(0);
        const user = result.users[0].user;
        expect(user.username).toBe("therock");
        expect(user.full_name).toBeTruthy();
        expect(user.profile_pic_url).toBeTruthy();
    });

    testWrapper("Search Result Hashtags", async () => {
        const result = await createApi(
            "search",
            "nofilter",
            libraryTestOptions,
        ).get();
        expect(result.hashtags.length).toBeGreaterThan(0);
        const hashtag = result.hashtags[0].hashtag;
        expect(hashtag.media_count).not.toBeUndefined();
        expect(hashtag.name).toBe("nofilter");
    });

    testWrapper("Search Result Places", async () => {
        const result = await createApi(
            "search",
            "New york",
            libraryTestOptions,
        ).get();
        expect(result.places.length).toBeGreaterThan(0);
        const place = result.places[0].place;
        expect(place.title).toMatch(/New York/);
    });

    testWrapper("Incorrect validation", async () => {
        const failingValidator = t.type({
            foo: t.string,
        });

        expect.hasAssertions();
        const search = createApi("search", "Doesn't matter", {
            strict: true,
            validator: failingValidator,
        });

        try {
            await search.get();
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
            expect(e.message).toMatch(/^Invalid value/);
        }
        await search.forceStop();
    });

    testWrapper("Search should fire only one network request", async () => {
        const searchRequestsSpy = jest.fn();

        class RequestCounter<PostType> implements IPlugin<PostType> {
            public async requestEvent(
                this: IPluginContext<IPlugin<PostType>, PostType>,
                req: Request,
                overrides: Overrides,
            ) {
                if (this.state.matchURL(req.url())) {
                    searchRequestsSpy();
                }
            }
        }

        const search = createApi(
            "search",
            "A really long long long string to find something in Instagram",
            {
                plugins: [new RequestCounter()],
            },
        );

        await search.get();
        expect(searchRequestsSpy).toBeCalledTimes(1);
    });
});

describe("Plugins", () => {
    testWrapper("Internal plugins", async () => {
        for (const plugin in plugins) {
            if (!plugins.hasOwnProperty(plugin)) {
                continue;
            }

            const options: IOptions = {
                plugins: [new plugins[plugin]()],
                silent: true,
                total: 100,
            };
            const hashtag = createApi("hashtag", hashtags[0], options);

            const mock = jest.fn();
            for await (const post of hashtag.generator()) {
                mock(post);
            }
            expect(mock).toBeCalledTimes(100);
        }
    });
});

describe("Browser instance passed from outside", () => {
    const browserOptions = {
        headless: true,
    };
    testWrapper("Should re-use this browser instance", async () => {
        const browser = await launch(browserOptions);

        const hashtagGenerator = createApi("hashtag", hashtags[0], {
            browserInstance: browser,
        }).generator();
        await hashtagGenerator.next();

        const pages = await browser.pages();

        expect(pages.length).toBe(2);

        await browser.close();
    });

    testWrapper("Should not close browser instance", async () => {
        const browser = await launch(browserOptions);

        const searchGenerator = createApi("search", "therock", {
            browserInstance: browser,
        }).generator();
        await searchGenerator.next();

        expect(browser.isConnected()).toBe(true);

        await browser.close();
    });
});
