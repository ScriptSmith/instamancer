import {Hashtag, Location, User, ApiOptions} from "./src/api"
import * as winston from "winston";

let hashtags = ["beach", "gym", "puppies", "party", "throwback"];
let locations = ["1110037669039751", "212988663", "933522", "213385402", "228001889"];
let users = ["snoopdogg", "arianagrande", "bbc", "whitehouse", "australia"];

let smallSize = 50, mediumSize = 500, largeSize = 5000;

jest.setTimeout(20 * 60 * 1000);

function testSize(endpoint, ids: Array<string>, size: number, callback) {
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
        silent: true,
        sleepTime: 2 * ids.length
    };

    for (let id of ids) {
        test(`Download ${size} posts from ${endpoint} ${id}`, async () => {
            // Create API
            let api = new endpoint(id, options);
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
        });
    }

    callback();
}

let functionParams = [];

// Hashtags
functionParams.push([Hashtag, hashtags, smallSize]);
functionParams.push([Hashtag, hashtags.slice(0, 3), mediumSize]);
functionParams.push([Hashtag, hashtags.slice(0, 1), largeSize]);

// Locations
functionParams.push([Location, locations, smallSize]);
functionParams.push([Location, locations.slice(0, 3), mediumSize]);
functionParams.push([Location, locations.slice(0, 1), largeSize]);

// Users
functionParams.push([User, users, smallSize]);
functionParams.push([User, users.slice(0, 3), mediumSize]);
functionParams.push([User, users.slice(0, 1), largeSize]);

let functions = functionParams.map((params) =>
    () =>
        new Promise(res =>
            testSize(params[0], params[1], params[2], res)
        )
);

(async () => {
    for (let f of functions) {
        await f();
    }
})();
