#!/usr/bin/env node

import * as fs from "fs";
import * as readline from "readline";
import * as winston from "winston";
import * as yargs from "yargs";

import {Hashtag, IApiOptions, Location, User} from "./src/api";
import {download, toCSV, toJSON} from "./src/download";

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
            "batch [batchfile]",
            "Read a list of arguments from a file",
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
                            functions.push(
                                () => new Promise((res) =>
                                    buildParser(line, res),
                                ),
                            );
                        })
                    .on("close",
                        // When all lines have been read, synchronously
                        // execute the commands by waiting for their
                        // promises to be resolved
                        async () => {
                            for (const f of functions) {
                                await f();
                            }
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
            silent: {
                boolean: true,
                default: false,
                describe: "Disable progress output",
            },
            filename: {
                alias: ["file", "f", "out"],
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
                describe: "Directory to save thumbnails",
            },
            logging: {
                default: "none",
                choices: ["none", "info", "debug"],
                describe: "Level of logger",
            },
            logfile: {
                default: "socialcreaper.log",
                describe: "Name of the log file",
            },
        })
        .demandCommand()
        .example("$0 hashtag instagood -d",
            "Download all the available posts, and their thumbnails from #instagood")
        .example("$0 location 644269022 --count 200",
            "Download 200 posts tagged as being at the Arc Du Triomphe")
        .example("$0 user arianagrande --filetype=csv --loging=info --visible",
            "Download Ariana Grande's posts to a CSV file with a non-headless browser, and log all events")
        .epilog("Source code available at https://github.com/ScriptSmith/socialcreaper")
        .argv;
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

    // Pick endpoint
    let api;
    if (args["_"][0] === "hashtag") {
        api = Hashtag;
    } else if (args["_"][0] === "location") {
        api = Location;
    } else if (args["_"][0] === "user") {
        api = User;
    }

    // Define options
    const options: IApiOptions = {
        total: args["count"],
        headless: !args["visible"],
        logger,
        silent: args["silent"],
        sleepTime: 2,
        enableGrafting: args["graft"],
    };

    // Start API
    logger.info("Starting API");
    const obj = new api(args["id"], options);
    await obj.start();

    // Add pause callback
    pauseCallback(obj);

    // Replace downdir
    const downdir = args["downdir"].replace("[id]", args["id"]).replace("[endpoint]", args["_"]);

    // Download posts
    const posts = [];
    for await (const post of obj.itr()) {
        // Save post
        posts.push(post);

        // Download thumbnail
        if (args["download"] && "node" in post) {
            download(post.node.thumbnail_src, post.node.shortcode, downdir, () => null);
        }
    }

    // Replace filename
    const filename = args["filename"].replace("[id]", args["id"]).replace("[endpoint]", args["_"]);

    // Save file
    if (args["filetype"] !== "json") {
        toCSV(posts, filename + ".csv");
    }
    if (args["filetype"] !== "csv") {
        toJSON(posts, filename + ".json");
    }
}

// Catch key presses
readline.emitKeypressEvents(process.stdin);
if ("setRawMode" in process.stdin) {
    process.stdin.setRawMode(true);
}

/**
 * Call obj.pause() when spacebar pressed, send sigint when Ctrl + c pressed
 * @param obj
 */
function pauseCallback(obj) {
    process.stdin.on("keypress", (str, key) => {
        if (key.name === "space") {
            obj.pause();
        } else if (key.name === "c" && key.ctrl) {
            process.kill(process.pid, "SIGINT");
        }
    });
}

// Parse args
buildParser(process.argv.slice(2), () => process.exit(0));
