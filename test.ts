import {Hashtag, Location, User, ApiOptions, Instagram} from "./src/api"
import * as winston from "winston";
import {Hash} from "crypto";

let hashtags = ["beach", "gym", "puppies", "party", "throwback"];
let locations = ["1110037669039751", "212988663", "933522", "213385402", "228001889"];
let users = ["snoopdogg", "arianagrande", "bbc", "whitehouse", "australia"];

let smallSize = 30, mediumSize = 300, largeSize = 3000;

let data = [
    [
        Hashtag,
        hashtags,
        [smallSize, mediumSize, largeSize]
    ],
    [
        Location,
        locations,
        [smallSize, mediumSize, largeSize]
    ],
    [
        User,
        users,
        [smallSize, mediumSize]
    ]
];

jest.setTimeout(120 * 60 * 1000);

async function runTests(endpoints) {
    test('API', async () => {
        for (let endpoint of endpoints) {
            // Get params
            let API = endpoint[0];
            let ids = endpoint[1];
            let sizes = endpoint[2];

            for (let size of sizes) {
                // Decide how many ids to test based on size
                let sizeIds;
                let splitLen = 5;
                if (size == mediumSize) {
                    splitLen = 3;
                } else if (size == largeSize) {
                    splitLen = 1;
                }
                sizeIds = ids.slice(0, splitLen);

                for (let id of sizeIds) {
                    console.log(`Testing ${id} ${size}`);
                    // Specify API options
                    let options: ApiOptions = {
                        total: size,
                        headless: true,
                        logger: winston.createLogger({
                            level: 'error',
                            format: winston.format.json(),
                            silent: true,
                            transports: []
                        }),
                        silent: false,
                        sleepTime: 2,
                        enableGrafting: true
                    };

                    // Create API
                    let api = new API(id, options);
                    await api.start();

                    // Get posts
                    let posts = [];
                    let postIds = new Set();
                    for await (let post of api.itr()) {
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
