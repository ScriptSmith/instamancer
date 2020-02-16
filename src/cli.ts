#!/usr/bin/env node

import * as aws from "aws-sdk";
import * as fs from "fs";
import * as readline from "readline";
import * as winston from "winston";

import * as path from "path";
import {v4 as uuid} from "uuid";
import * as plugins from "../plugins";
import {createApi, IOptions} from "./api/api";
import {TFullApiPost, TPost} from "./api/types";
import {GetPool} from "./getpool/getPool";
import * as depotUpload from "./http/depot";
import {download, toCSV, toJSON} from "./http/download";
import * as s3Upload from "./http/s3";

const getLogger = (args) => {
    const transports = [];
    if (args["logging"] !== "none") {
        transports.push(
            new winston.transports.File({
                filename: args["logfile"],
                level: args["logging"],
                silent: args["logging"] === "none",
            }),
        );
    }
    return winston.createLogger({
        level: args["logging"],
        silent: args["logging"] === "none",
        transports,
    });
};

function getOptions(args, logger) {
    const options: IOptions = {
        enableGrafting: args["graft"],
        executablePath: args["browser"],
        fullAPI: args["full"],
        headless: !args["visible"],
        logger,
        plugins: [],
        sameBrowser: args["sameBrowser"],
        silent: args["quiet"],
        sleepTime: args["sleep"],
        strict: args["strict"],
        total: args["count"],
    };

    for (const pluginName of args["plugin"]) {
        if (plugins.plugins[pluginName]) {
            options.plugins.push(new plugins.plugins[pluginName]());
        } else {
            throw new Error("Couldn't find plugin " + pluginName);
        }
    }
    return options;
}

/**
 * Build argument parser
 */
function buildParser(args, callback) {
    /* tslint:disable:no-unused-expression */
    require("yargs")(args)
        .usage("Usage: $0 <command> [options]")
        .command("hashtag [id]", "Scrape a hashtag", {}, async (handleArgs) => {
            await spawn(handleArgs);
            callback();
        })
        .command(
            "user [id]",
            "Scrape a users posts",
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
            "search [query]",
            "Perform a search of users, tags and places",
            {},
            async (handleArgs) => {
                const logger = getLogger(handleArgs);
                const options = getOptions(handleArgs, logger);
                if (!handleArgs["query"]) {
                    throw new Error("query required");
                }
                const search = createApi(
                    "search",
                    handleArgs["query"],
                    options,
                );
                const result = await search.get();
                process.stdout.write("\n");
                process.stdout.write(JSON.stringify(result, null, 2));
                process.stdout.write("\n");
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
                readline
                    .createInterface({
                        crlfDelay: Infinity,
                        input: fs.createReadStream(args[1]),
                    })
                    .on(
                        "line",
                        // For each line, create a new function which
                        // creates a new promise to be resolved by
                        // buildParser
                        (line) => {
                            if (line.length > 0 && line.charAt(0) !== "#") {
                                functions.push(
                                    () =>
                                        new Promise((res) =>
                                            buildParser(line, res),
                                        ),
                                );
                            }
                        },
                    )
                    .on(
                        "close",
                        // When all lines have been read, synchronously
                        // execute the commands by waiting for their
                        // promises to be resolved
                        async () => {
                            for (const f of functions) {
                                await f();
                            }
                            process.exit();
                        },
                    );
            },
        )
        /* tslint:disable:object-literal-sort-keys */
        .options({
            count: {
                alias: "c",
                number: true,
                default: 0,
                describe: "Number of posts to download (0 for all)",
                group: "Configuration",
            },
            full: {
                alias: ["f"],
                boolean: true,
                default: false,
                describe: "Retrieve full post data",
                group: "Configuration",
            },
            sleep: {
                alias: ["s"],
                number: true,
                default: 2,
                describe: "Seconds to sleep between interactions",
                group: "Configuration",
            },
            graft: {
                alias: "g",
                boolean: true,
                default: true,
                describe: "Enable grafting",
                group: "Configuration",
            },
            browser: {
                alias: ["b"],
                string: true,
                default: undefined,
                describe: "Browser path. Defaults to the puppeteer version",
                group: "Configuration",
            },
            sameBrowser: {
                boolean: true,
                default: false,
                describe: "Use a single browser when grafting",
                group: "Configuration",
            },
            download: {
                alias: "d",
                boolean: true,
                default: false,
                describe: "Save images from posts",
                group: "Download",
            },
            downdir: {
                default: "downloads/[endpoint]/[id]",
                describe: "Download path",
                group: "Download",
            },
            video: {
                alias: "v",
                boolean: true,
                default: false,
                describe: "Download videos (requires full)",
                implies: "full",
                group: "Download",
            },
            sync: {
                boolean: true,
                default: false,
                describe: "Force download between requests",
                group: "Download",
            },
            threads: {
                alias: "k",
                number: true,
                default: 4,
                describe: "Parallel download / depot threads",
                group: "Download",
            },
            waitDownload: {
                alias: "w",
                boolean: true,
                default: false,
                describe: "Download media after scraping",
                group: "Download",
            },
            bucket: {
                string: true,
                default: undefined,
                describe: "Upload files to an AWS S3 bucket",
                group: "Upload",
            },
            depot: {
                string: true,
                default: undefined,
                describe: "Upload files to a URL with a PUT request (depot)",
                group: "Upload",
            },
            file: {
                alias: ["o"],
                string: true,
                default: "[id]",
                describe: "Output filename. '-' for stdout",
                group: "Output",
            },
            type: {
                alias: ["t"],
                default: "json",
                describe: "Filetype",
                choices: ["csv", "json", "both"],
                group: "Output",
            },
            mediaPath: {
                alias: ["m"],
                boolean: true,
                default: false,
                describe: "Add filepaths to _mediaPath",
                group: "Output",
            },
            visible: {
                boolean: true,
                default: false,
                describe: "Show browser on the screen",
                group: "Display",
            },
            quiet: {
                alias: ["q"],
                boolean: true,
                default: false,
                describe: "Disable progress output",
                group: "Display",
            },
            logging: {
                alias: ["l"],
                default: "none",
                choices: ["none", "error", "info", "debug"],
                group: "Logging",
            },
            logfile: {
                string: true,
                default: "instamancer.log",
                describe: "Log file name",
                group: "Logging",
            },
            strict: {
                boolean: true,
                default: false,
                describe: "Throw an error on response type mismatch",
                group: "Validation",
            },
            plugin: {
                alias: ["p"],
                array: true,
                default: [],
                describe: "Use a plugin from the plugins directory",
                group: "Plugins",
            },
        })
        .demandCommand()
        .example(
            "$0 hashtag instagood -fvd",
            "Download all the available posts, and their media from #instagood",
        )
        .example(
            "$0 user arianagrande --type=csv --logging=info --visible",
            "Download Ariana Grande's posts to a CSV file with a non-headless browser, and log all events",
        )
        .epilog(
            "Source code available at https://github.com/ScriptSmith/instamancer",
        )
        .strict().argv;
    /* tslint:enable:no-unused-expression */
}

/**
 * Spawn an instance of the API
 * @param args
 */
async function spawn(args) {
    // Initiate logger
    const logger = getLogger(args);

    // Check id
    if (!(args["id"] || args["ids"])) {
        throw new Error("Id required");
    }

    // Pick endpoint
    let ids;
    if (args["_"][0] === "post") {
        ids = args["ids"].split(",");
        args["id"] = ids.length === 1 ? ids[0] : "posts";
        args["full"] = true;
    } else {
        ids = args["id"];
    }

    // Define options
    const options: IOptions = getOptions(args, logger);

    // Replace downdir
    const downdir = args["downdir"]
        .replace("[id]", args["id"])
        .replace("[endpoint]", args["_"]);

    // Replace depot url
    let depotUrl = args["depot"];
    if (depotUrl && depotUrl.includes("[uuid]")) {
        depotUrl = depotUrl.replace("[uuid]", uuid());
        if (!args["quiet"]) {
            process.stdout.write(depotUrl + "\n");
        }
    }

    // Get s3 bucket
    const s3Bucket = args["bucket"];

    // Check if outputting to stdout
    const printOutput = args["file"] === "-";

    // Connect to object storage
    let downloadUpload;
    let toCSVFunc = toCSV;
    let toJSONFunc = toJSON;
    if (depotUrl) {
        // Depot
        const depotConfig = {
            directory: downdir,
            url: depotUrl,
            logger,
        };

        downloadUpload = depotUpload.depot.bind(depotConfig);
        toCSVFunc = depotUpload.toCSV.bind(depotConfig);
        toJSONFunc = depotUpload.toJSON.bind(depotConfig);
    } else if (s3Bucket) {
        // s3
        const s3Config = {
            bucket: s3Bucket,
            directory: downdir,
            s3: new aws.S3(),
            logger,
        };

        downloadUpload = s3Upload.s3.bind(s3Config);
        toCSVFunc = s3Upload.toCSV.bind(s3Config);
        toJSONFunc = s3Upload.toJSON.bind(s3Config);
    } else {
        // Download
        downloadUpload = download.bind({
            directory: downdir,
            logger,
        });
    }

    // Start API
    logger.info("Starting API at " + Date.now());
    const obj = createApi(args["_"][0], ids, options);
    await obj.start();

    // Start download pool
    const getPool = new GetPool(args["threads"], downloadUpload);

    // Pick between synchronous and parallel downloads
    const downloadFunction = args["sync"]
        ? downloadUpload
        : getPool.add.bind(getPool);

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

    // Array of urls and filenames
    let downloadMedia: Array<[string, string, FILETYPES]> = [];

    // Download posts
    const posts = [];
    for await (const post of obj.generator()) {
        // Add _mediaPath key
        if (args["mediaPath"]) {
            post["_mediaPath"] = [];
        }

        // Identify download urls
        if (args["download"] && ("node" in post || "shortcode_media" in post)) {
            // Check the scraping level
            if (args["full"]) {
                // Check if album
                const postObject = post as TFullApiPost;
                const children =
                    postObject.shortcode_media.edge_sidecar_to_children;
                if (children !== undefined) {
                    for (const child of children.edges) {
                        const shortcode = child.node.shortcode;

                        // Check if video
                        let mediaUrl: string;
                        let mediaType: FILETYPES;
                        if (child.node.is_video && args["video"]) {
                            mediaUrl = child.node.video_url;
                            mediaType = FILETYPES.VIDEO;
                        } else {
                            mediaUrl = child.node.display_resources.pop().src;
                            mediaType = FILETYPES.IMAGE;
                        }
                        saveMediaMetadata(
                            post,
                            args,
                            downloadMedia,
                            downdir,
                            mediaUrl,
                            shortcode,
                            mediaType,
                        );
                    }
                } else {
                    const shortcode = postObject.shortcode_media.shortcode;

                    // Check if video
                    let mediaUrl: string;
                    let mediaType: FILETYPES;
                    if (postObject.shortcode_media.is_video && args["video"]) {
                        mediaUrl = postObject.shortcode_media.video_url;
                        mediaType = FILETYPES.VIDEO;
                    } else {
                        mediaUrl = postObject.shortcode_media.display_resources.pop()
                            .src;
                        mediaType = FILETYPES.IMAGE;
                    }
                    saveMediaMetadata(
                        post,
                        args,
                        downloadMedia,
                        downdir,
                        mediaUrl,
                        shortcode,
                        mediaType,
                    );
                }
            } else {
                const postObject = post as TPost;
                saveMediaMetadata(
                    post,
                    args,
                    downloadMedia,
                    downdir,
                    postObject.node.thumbnail_src,
                    postObject.node.shortcode,
                    FILETYPES.IMAGE,
                );
            }
        }

        // Save post
        posts.push(post);

        // Output if required
        if (printOutput) {
            process.stdout.write(JSON.stringify(post, null, 2) + "\n");
        }

        // Download the identified media
        if (!args["waitDownload"]) {
            for (const asset of downloadMedia) {
                await downloadFunction(...asset);
            }
            downloadMedia = [];
        }
    }

    // Download remaining media
    for (const asset of downloadMedia) {
        await downloadFunction(...asset);
    }

    // Close download pool
    await new Promise((resolve) => {
        getPool.close(resolve);
    });
    await Promise.all(getPool.promises);

    // Replace filename
    const filename = args["file"]
        .replace("[id]", args["id"])
        .replace("[endpoint]", args["_"]);

    // Save file
    if (!printOutput) {
        if (args["type"] !== "json") {
            let saveFile = filename;
            if (args["type"] === "both" || args["file"] === "[id]") {
                saveFile += ".csv";
            }
            await toCSVFunc(posts, saveFile);
        }
        if (args["type"] !== "csv") {
            let saveFile = filename;
            if (args["type"] === "both" || args["file"] === "[id]") {
                saveFile += ".json";
            }
            await toJSONFunc(posts, saveFile);
        }
    }

    // Remove pause callback
    process.stdin.removeAllListeners("keypress");

    // Close logger
    logger.close();
}

function saveMediaMetadata(
    post: object,
    args: object,
    downloadMedia: Array<[string, string, FILETYPES]>,
    downDir: string,
    url: string,
    shortcode: string,
    fileType: FILETYPES,
) {
    if (args["mediaPath"]) {
        let uri = path.join(downDir, shortcode + "." + fileType);
        uri = args["swift"] ? "swift://" + uri : uri;
        post["_mediaPath"].push(uri);
    }
    downloadMedia.push([url, shortcode, fileType]);
}

// Catch key presses
readline.emitKeypressEvents(process.stdin);
if ("setRawMode" in process.stdin) {
    process.stdin.setRawMode(true);
}

// Parse args
buildParser(process.argv.slice(2), () => {
    process.exit(0);
});

enum FILETYPES {
    VIDEO = "mp4",
    IMAGE = "jpg",
}
