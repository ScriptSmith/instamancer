import * as t from "io-ts";
import * as winston from "winston";
import {createApi} from "..";
import {
  Hashtag,
  IOptions,
  IOptionsFullApi,
  Location,
  User,
} from "../src/api/api";
import {FakePage, IFakePageOptions} from "./__fixtures__/FakePage";
import {QuickGraft} from "./__fixtures__/QuickGraft";
import {startServer, stopServer} from "./server";

jest.setTimeout(120 * 60 * 1000);
/* tslint:disable:no-console */

const hashtags = ["beach", "gym", "puppies", "party", "throwback"];
const locations = [
  "1110037669039751",
  "212988663",
  "933522",
  "213385402",
  "228001889",
];
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
    level: "error",
    silent: true,
    transports: [],
  });

const libraryTestOptions: IOptions = {
  logger: createLogger(),
  silent: true,
  strict: true,
  total: 10,
};

test("Library Classes", async () => {
  const total = 10;
  const objects = [
    createApi("hashtag", hashtags[0], libraryTestOptions),
    createApi("user", users[0], libraryTestOptions),
    createApi("location", locations[0], libraryTestOptions),
    createApi("post", posts, libraryTestOptions),
  ];

  for (const object of objects) {
    const scraped = [];
    for await (const post of object.generator()) {
      expect(post).toBeDefined();
      scraped.push(post);
    }
    expect(scraped.length).toBe(total);
  }
});

test("Library Functions", async () => {
  const total = 10;
  const generators = [
    createApi("hashtag", hashtags[0], libraryTestOptions).generator(),
    createApi("user", users[0], libraryTestOptions).generator(),
    createApi("location", locations[0], libraryTestOptions).generator(),
    createApi("post", posts, libraryTestOptions).generator(),
  ];

  for (const generator of generators) {
    const scraped = [];
    for await (const post of generator) {
      expect(post).toBeDefined();
      scraped.push(post);
    }
    expect(scraped.length).toBe(total);
  }
});

test("Full API", async () => {
  const total = 10;
  const fullApiOption: IOptionsFullApi = {
    ...libraryTestOptions,
    fullAPI: true,
  };
  const generators = [
    createApi("hashtag", hashtags[0], fullApiOption).generator(),
    createApi("user", users[0], fullApiOption).generator(),
    createApi("location", locations[0], fullApiOption).generator(),
    createApi("post", posts, fullApiOption).generator(),
  ];

  for (const generator of generators) {
    const scraped = [];
    for await (const post of generator) {
      expect(post).toBeDefined();
      scraped.push(post);
    }
    expect(scraped.length).toBe(total);
  }
});

class ApiTestConditions {
  public api: typeof InstagramEndpoint;
  public ids: string[];
  public sizes: number[];

  constructor(api: typeof InstagramEndpoint, ids: string[], sizes: number[]) {
    this.api = api;
    this.ids = ids;
    this.sizes = sizes;
  }
}

class InstagramEndpoint {
  constructor(id: string, options: object = {}) {
    id = null;
    options = null;
  }

  public async *generator() {
    // pass
  }
}

const endpoints: ApiTestConditions[] = [
  new ApiTestConditions(Hashtag, hashtags, [largeSize, mediumSize, smallSize]),
  new ApiTestConditions(Location, locations, [
    largeSize,
    mediumSize,
    smallSize,
  ]),
  new ApiTestConditions(User, users, [mediumSize, smallSize]),
];

test("Instagram API limits", async () => {
  for (const endpoint of endpoints) {
    // Get params
    const API = endpoint.api;
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
        console.log(`Testing ${id} ${size}`);
        // Specify API options
        const options: IOptions = {
          enableGrafting: true,
          fullAPI: false,
          headless: true,
          logger: winston.createLogger({
            format: winston.format.json(),
            level: "error",
            silent: true,
            transports: [],
          }),
          silent: false,
          sleepTime: 2,
          strict: true,
          total: size,
        };

        // Create API
        const api = new API(id, options);

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
      }
    }
  }
});

test("Empty page", async () => {
  const user = createApi("user", emptyAccountName, {}).generator();
  const userPosts = [];
  for await (const post of user) {
    userPosts.push(post);
  }
  expect(userPosts.length).toBe(0);
});

const apiOptions: IOptions[] = [
  {silent: true},
  {sleepTime: 5},
  {headless: false},
  {enableGrafting: false},
  {executablePath: browserPath},
  {fullAPI: true},
  {fullAPI: true, total: 5},
];

test("API options", async () => {
  const hashtagId = "vetinari";
  const total = 50;
  let options: IOptions[] = [];

  // No options default
  options.push({});

  // Add options list
  options = options.concat(
    apiOptions.map((option) => {
      option.total = option.total < total ? option.total : total;
      return option;
    }),
  );

  for (const indexOption of options.entries()) {
    const [index, option] = indexOption;
    // @ts-ignore
    const tag = createApi("hashtag", hashtagId, option);
    const scraped = [];

    for await (const post of tag.generator()) {
      expect(post).toBeDefined();
      scraped.push(post);
    }

    if (index === 0) {
      expect(scraped.length).toBeGreaterThan(total);
    } else if (index === options.length - 1) {
      expect(scraped.length).toBe(5);
    } else {
      expect(scraped.length).toBe(total);
    }
  }
});

test("No grafting", async () => {
  const total = 100;
  const hashtag = hashtags[0];
  const api = new QuickGraft(hashtag, {total, enableGrafting: false});
  const scraped = [];

  for await (const post of api.generator()) {
    scraped.push(post);
  }

  expect(scraped.length).toBe(total);
});

test("Pausing", async () => {
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

test("Hibernation", async () => {
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

test("Sandbox", async () => {
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

test("Failed Page visit", async () => {
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
    await api.forceStop();
  }

  expect(scraped.length).toBe(0);
});

test("Network and API issues", async () => {
  const port = await startServer();
  console.log("Server: http://127.0.0.1:" + port);

  async function testOptions(options: IFakePageOptions) {
    process.stdout.write("Testing " + options.catchPage + "\n");

    const api = new FakePage(options);
    try {
      for await (let _ of api.generator()) {
        _ = null;
      }
    } catch (e) {
      expect(e).toBeDefined();
    }
    await api.forceStop();
  }

  // Test rate limiting
  await testOptions({
    catchPage: "rate_limit",
    options: {hibernationTime: 10},
    port,
  });

  // Test invalid JSON response
  await testOptions({port, catchPage: "invalid_json"});

  // Test no next page in JSON response
  await testOptions({port, catchPage: "no_next_page", pageQuery: "data"});

  // Test duplicate post ids scraped
  await testOptions({
    catchPage: "duplicate_ids",
    edgeQuery: "data.edges",
    pageQuery: "data",
    port,
  });

  // Test invalid post id page
  await testOptions({
    catchPage: "invalid_id",
    edgeQuery: "data.edges",
    options: {fullAPI: true, total: 1},
    pageQuery: "data",
    port,
  });

  await stopServer();
});

describe("Strict mode", () => {
  const failingValidator = t.type({
    foo: t.string,
  });

  test("Should fire warning if strict is false and validations are different", async () => {
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
  });

  test("Should not fire warning if strict is false and validations are ok", async () => {
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
  });

  test("Should throw validation error if strict is true and types are incorrect", async () => {
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
  });

  test("Should throw validation error if strict is true and types are incorrect (Post)", async () => {
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
  });

  test("Should throw validation error if strict is true and types are incorrect (Full Mode)", async () => {
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
  });
});
