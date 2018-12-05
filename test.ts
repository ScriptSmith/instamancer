import * as winston from "winston";
import {Hashtag, IApiOptions, Location, User} from "./src/api";

/* tslint:disable:no-console */

const hashtags = ["beach", "gym", "puppies", "party", "throwback"];
const locations = ["1110037669039751", "212988663", "933522", "213385402", "228001889"];
const users = ["snoopdogg", "arianagrande", "bbc", "whitehouse", "australia"];

const smallSize = 30;
const mediumSize = 300;
const largeSize = 3000;

const data = [
    [
        Hashtag,
        hashtags,
        [smallSize, mediumSize, largeSize],
    ],
    [
        Location,
        locations,
        [smallSize, mediumSize, largeSize],
    ],
    [
        User,
        users,
        [smallSize, mediumSize],
    ],
];

jest.setTimeout(120 * 60 * 1000);

async function runTests(endpoints) {
    test("API", async () => {
        for (const endpoint of endpoints) {
            // Get params
            const API = endpoint[0];
            const ids = endpoint[1];
            const sizes = endpoint[2];

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
                        duplicates: largeSize,
                        enableGrafting: true,
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
                    await api.start();

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
}


(async () => {
    await runTests(data);
})();
