import * as winston from "winston";
import * as Instamancer from ".";
import {Hashtag, IApiOptions, Location, User} from "./src/api";

/* tslint:disable:no-console */

const hashtags = ["beach", "gym", "puppies", "party", "throwback"];
const locations = ["1110037669039751", "212988663", "933522", "213385402", "228001889"];
const users = ["snoopdogg", "arianagrande", "bbc", "whitehouse", "australia"];

const smallSize = 30;
const mediumSize = 300;
const largeSize = 3000;

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
    private options: object;
    private id: string;
    constructor(id: string, options: object = {}) {
        this.id = id;
        this.options = options;
    }

    public async* generator() {
        // pass
    }
}

const libraryTestOptions: IApiOptions = {
    logger: winston.createLogger({
        format: winston.format.json(),
        level: "error",
        silent: true,
        transports: [],
    }),
    silent: true,
    total: 10,
};

test("Library", async () => {
    const testHashtag = new Instamancer.Hashtag(hashtags[0], libraryTestOptions);
    for await (const post of testHashtag.generator()) {
        expect(post).toBeDefined();
    }

    const testLocation = new Instamancer.Location(locations[0], libraryTestOptions);
    for await (const post of testLocation.generator()) {
        expect(post).toBeDefined();
    }

    const testUser = new Instamancer.User(users[0], libraryTestOptions);
    for await (const post of testUser.generator()) {
        expect(post).toBeDefined();
    }
});

const endpoints: ApiTestConditions[] = [
    new ApiTestConditions(Hashtag, hashtags, [smallSize, mediumSize, largeSize]),
    new ApiTestConditions(Location, locations, [smallSize, mediumSize, largeSize]),
    new ApiTestConditions(User, users, [smallSize, mediumSize]),
];

jest.setTimeout(120 * 60 * 1000);

test("API", async () => {
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
                const options: IApiOptions = {
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
                    total: size,
                };

                // Create API
                const api = new API(id, options);

                // Get posts
                const posts = [];
                const postIds = new Set();
                for await (const post of api.generator()) {
                    postIds.add(post.node.id);
                    posts.push(post);
                }

                // Assert sizes
                expect(posts.length).toBe(size);

                // Check duplicates
                expect(posts.length).toBe(postIds.size);
            }
        }
    }
});
