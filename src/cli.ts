#!/usr/bin/env node

import * as fs from "fs";
import * as readline from "readline";
import * as winston from "winston";

import {Hashtag, IOptions, Location, Post, User} from "./api/api";
import {toCSV, toJSON} from "./download";
import {GetPool} from "./getpool/getPool";

/**
 * Build argument parser
 */
function buildParser(args, callback) {
    /* tslint:disable:no-unused-expression */
    require("yargs")
    (args)
        .usage("Usage: $0 <command> [options]")
        .command(
            "hashtag [id]",
            "Scrape a hashtag",
            {},
            async (handleArgs) => {
                await spawn(handleArgs);
                callback();
            },
        )
        .command(
            "location [id]",
            "Scrape a location",
            {},
            async (handleArgs) => {
                await spawn(handleArgs);
                callback();
            },
        )
        .command(
            "user [id]",
            "Scrape a user",
            {},
            async (handleArgs) => {
                await spawn(handleArgs);
                callback();
            },
        )
        .command(
            "post [ids]",
            "Scrape a comma-separated list of posts",
            {},
            async (handleArgs) => {
                await spawn(handleArgs);
                callback();
            },
        )
        .command(
            "batch [batchfile]",
            "Read newline-separated arguments from a file",
            {},
            () => {
                // A list of functions which create new Promises that are
                // resolved by buildParser when the spawn commands are
                // finished
                // See https://stackoverflow.com/a/45951080/7435520
                const functions = [];

                // Read the list of commands from file
                readline.createInterface({
                    crlfDelay: Infinity,
                    input: fs.createReadStream(args[1]),
                })
                    .on("line",
                        // For each line, create a new function which
                        // creates a new promise to be resolved by
                        // buildParser
                        (line) => {
                            if (line.length > 0 && line.charAt(0) !== "#") {
                                functions.push(
                                    () => new Promise((res) =>
                                        buildParser(line, res),
                                    ),
                                );
                            }
                        })
                    .on("close",
                        // When all lines have been read, synchronously
                        // execute the commands by waiting for their
                        // promises to be resolved
                        async () => {
                            for (const f of functions) {
                                await f();
                            }
                            process.stdin.destroy();
                        });
            },
        )
        /* tslint:disable:object-literal-sort-keys */
        .options({
            count: {
                alias: "c",
                default: 0,
                describe: "Number of posts to download. 0 to download all",
            },
            visible: {
                default: false,
                describe: "Show browser on the screen",
            },
            download: {
                alias: "d",
                boolean: true,
                default: false,
                describe: "Save images and videos from posts",
            },
            graft: {
                alias: "g",
                boolean: true,
                default: true,
                describe: "Enable grafting",
            },
            full: {
                boolean: true,
                default: false,
                describe: "Get the full details about posts from the API",
            },
            video: {
                boolean: true,
                default: false,
                describe: "Download videos. Only works in full mode",
            },
            silent: {
                boolean: true,
                default: false,
                describe: "Disable progress output",
            },
            waitDownload: {
                alias: "w",
                boolean: true,
                default: false,
                describe: "When true, media will only download once scraping is finished",
            },
            filename: {
                alias: ["file", "f"],
                default: "[id]",
                describe: "Name of the output file",
            },
            filetype: {
                alias: ["type", "t"],
                default: "json",
                choices: ["csv", "json", "both"],
                describe: "Type of output file ",
            },
            downdir: {
                default: "downloads/[endpoint]/[id]",
                describe: "Directory to save media",
            },
            logging: {
                default: "none",
                choices: ["error", "none", "info", "debug"],
                describe: "Level of logger",
            },
            logfile: {
                default: "instamancer.log",
                describe: "Name of the log file",
            },
        })
        .demandCommand()
        .example("$0 hashtag instagood -d",
            "Download all the available posts, and their thumbnails from #instagood")
        .example("$0 location 644269022 --count 200",
            "Download 200 posts tagged as being at the Arc Du Triomphe")
        .example("$0 user arianagrande --filetype=csv --logging=info --visible",
            "Download Ariana Grande's posts to a CSV file with a non-headless browser, and log all events")
        .epilog("Source code available at https://github.com/ScriptSmith/instamancer")
        .strict()
        .argv;
    /* tslint:enable:no-unused-expression */
}

/**
 * Spawn an instance of the API
 * @param args
 */
async function spawn(args) {
    // Initiate logger
    const logger = winston.createLogger({
        level: args["logging"],
        silent: args["logging"] === "none",
        transports: [
            new winston.transports.File({
                filename: args["logfile"],
                silent: args["logging"] === "none",
            }),
        ],
    });

    // Check id
    if (!(args["id"] || args["ids"])) {
        throw new Error("Id required");
    }

    // Pick endpoint
    let api;
    let ids;
    if (args["_"][0] === "hashtag") {
        api = Hashtag;
        ids = args["id"];
    } else if (args["_"][0] === "location") {
        api = Location;
        ids = args["id"];
    } else if (args["_"][0] === "user") {
        api = User;
        ids = args["id"];
    } else if (args["_"][0] === "post") {
        api = Post;
        ids = args["ids"].split(",");
        args["id"] = ids.length === 1 ? ids[0] : "posts";
        args["full"] = true;
    }

    // Define options
    const options: IOptions = {
        total: args["count"],
        headless: !args["visible"],
        logger,
        silent: args["silent"],
        sleepTime: 2,
        enableGrafting: args["graft"],
        fullAPI: args["full"],
    };

    // Start API
    logger.info("Starting API at " + Date.now());
    const obj = new api(ids, options);
    await obj.start();

    // Start download pool
    const getPool = new GetPool();

    // Add pause callback
    function handleKeypress(str, key) {
        if (key.name === "space") {
            obj.pause();
        } else if (key.name === "c" && key.ctrl) {
            process.stdout.write("\n");
            process.kill(process.pid, "SIGINT");
        }
    }

    process.stdin.on("keypress", handleKeypress);

    // Replace downdir
    const downdir = args["downdir"].replace("[id]", args["id"]).replace("[endpoint]", args["_"]);

    // Array of urls and filenames
    let downloadMedia: Array<[string, string, FILETYPES]> = [];

    // Download posts
    const posts = [];
    for await (const post of obj.generator()) {
        // Save post
        posts.push(post);

        // Identify download urls
        if (args["download"] && ("node" in post || "shortcode_media" in post)) {
            // Check the scraping level
            if (args["full"]) {

                // Check if album
                const children = post.shortcode_media.edge_sidecar_to_children;
                if (children !== undefined) {
                    for (const child of children.edges) {
                        const shortcode = child.node.shortcode;

                        // Check if video
                        if (child.node.is_video && args["video"]) {
                            const videoUrl = child.node.video_url;
                            downloadMedia.push([videoUrl, shortcode, FILETYPES.VIDEO]);
                        } else {
                            const imageUrls = child.node.display_resources;
                            downloadMedia.push([imageUrls.pop().src, shortcode, FILETYPES.IMAGE]);
                        }
                    }
                } else {
                    const shortcode = post.shortcode_media.shortcode;

                    // Check if video
                    if (post.shortcode_media.is_video && args["video"]) {
                        const videoUrl = post.shortcode_media.video_url;
                        downloadMedia.push([videoUrl, shortcode, FILETYPES.VIDEO]);
                    } else {
                        const imageUrls = post.shortcode_media.display_resources;
                        downloadMedia.push([imageUrls.pop().src, shortcode, FILETYPES.IMAGE]);
                    }

                }
            } else {
                downloadMedia.push([post.node.thumbnail_src, post.node.shortcode, FILETYPES.IMAGE]);
            }
        }

        // Download the identified media
        if (!args["waitDownload"]) {
            for (const asset of downloadMedia) {
                await getPool.add(asset[0], asset[1], asset[2], downdir, logger);
            }
            downloadMedia = [];
        }
    }

    // Download remaining media
    for (const asset of downloadMedia) {
        await getPool.add(asset[0], asset[1], asset[2], downdir, logger);
    }

    // Close download pool
    getPool.close();

    // Replace filename
    const filename = args["filename"].replace("[id]", args["id"]).replace("[endpoint]", args["_"]);

    // Save file
    if (args["filetype"] !== "json") {
        let saveFile = filename;
        if (args["filetype"] === "both" || args["filename"] === "[id]") {
            saveFile += ".csv";
        }
        toCSV(posts, saveFile);
    }
    if (args["filetype"] !== "csv") {
        let saveFile = filename;
        if (args["filetype"] === "both" || args["filename"] === "[id]") {
            saveFile += ".json";
        }
        toJSON(posts, saveFile);
    }

    // Remove pause callback
    process.stdin.removeAllListeners("keypress");

    // Close logger
    logger.close();
}

// Catch key presses
readline.emitKeypressEvents(process.stdin);
if ("setRawMode" in process.stdin) {
    process.stdin.setRawMode(true);
}

// Parse args
buildParser(process.argv.slice(2), () => {
    process.stdin.destroy();
});

enum FILETYPES {
    VIDEO = "mp4",
    IMAGE = "jpg",
}
