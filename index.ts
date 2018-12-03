#!/usr/bin/env node

import * as readline from 'readline';
import * as fs from 'fs';

import winston = require("winston");

import {Hashtag, Location, User, ApiOptions} from "./src/api"
import {download, toCSV, toJSON} from "./src/download";


/**
 * Build argument parser
 */
function buildParser(args, callback) {
    require('yargs')
    (args)
        .command(
            'hashtag [id]',
            'Scrape a hashtag',
            {},
            async (args) => {
                await spawn(args);
                callback();
            }
        )
        .command(
            'location [id]',
            'Scrape a location',
            {},
            async (args) => {
                await spawn(args);
                callback();
            }
        )
        .command(
            'user [id]',
            'Scrape a user',
            {},
            async (args) => {
                await spawn(args);
                callback();
            }
        )
        .command(
            'batch [batchfile]',
            'Read a list of arguments from a file',
            {},
            () => {
                // A list of functions which create new Promises that are
                // resolved by buildParser when the spawn commands are
                // finished
                // See https://stackoverflow.com/a/45951080/7435520
                let functions = [];

                // Read the list of commands from file
                readline.createInterface({
                    input: fs.createReadStream(args[1]),
                    crlfDelay: Infinity
                })
                    .on('line',
                        // For each line, create a new function which
                        // creates a new promise to be resolved by
                        // buildParser
                        (line) => {
                            functions.push(
                                () => new Promise(res =>
                                    buildParser(line, res)
                                )
                            );
                        })
                    .on('close',
                        // When all lines have been read, synchronously
                        // execute the commands by waiting for their
                        // promises to be resolved
                        async () => {
                            for (let i = 0; i < functions.length; i++) {
                                await functions[i]();
                            }
                        });
            }
        )
        .options({
            'count': {
                alias: 'c',
                default: 0,
                describe: 'Number of posts to download. 0 to download all'
            },
            'visible': {
                default: false,
                describe: 'Show browser on the screen'
            },
            'download': {
                alias: 'd',
                boolean: true,
                default: false,
                describe: "Save images and videos from posts"
            },
            'filename': {
                alias: ['file', 'f', 'out'],
                default: "[id]",
                describe: "Name of the output file"
            },
            'filetype': {
                alias: ['type', 't'],
                default: 'json',
                choices: ['csv', 'json', 'both'],
                describe: "Type of output file "
            },
            'downdir': {
                default: 'downloads',
                describe: 'Directory to save thumbnails'
            },
            'logging': {
                default: 'none',
                choices: ['none', 'info', 'debug'],
                describe: 'Level of logger'
            },
            'logfile': {
                default: 'socialcreaper2.log',
                describe: 'Name of the log file'
            }
        })
        .demandCommand()
        .argv;
}


/**
 * Spawn an instance of the API
 * @param args
 */
async function spawn(args) {
    // Initiate logger
    let logger = winston.createLogger({
        level: args['logging'],
        silent: args['logging'] == "none",
        transports: [
            new winston.transports.File({
                filename: args['logfile'],
                silent: args['logging'] == 'none'
            })
        ]
    });

    // Pick endpoint
    let api;
    if (args['_'] == "hashtag") {
        api = Hashtag;
    } else if (args['_'] == "location") {
        api = Location;
    } else if (args['_'] == "user") {
        api = User;
    }

    // Define options
    let options: ApiOptions = {
        total: args['count'],
        headless: !args['visible'],
        logger: logger,
        silent: false
    };

    // Start API
    logger.info("Starting API");
    let obj = new api(args['id'], options);
    await obj.start();

    // Download posts
    let posts = [];
    for await (let post of obj.itr()) {
        // Wait if paused
        await waitResume();

        // Save post
        posts.push(post);

        // Download thumbnail
        if (args['download']) {
            download(post.node.thumbnail_src, post.node.shortcode, args['downdir'], () => null);
        }
    }

    // Replace filename
    let filename = args['filename'].replace('[id]', args['id']);

    // Save file
    if (args['filetype'] != 'json') {
        toCSV(posts, filename + '.csv');
    }
    if (args['filetype'] != 'csv') {
        toJSON(posts, filename + '.json');
    }
}

/**
 * Wait until not paused
 */
async function waitResume() {
    function f() {
        return new Promise(
            resolve => {
                setTimeout(resolve, 1000)
            }
        );
    }

    while (pause == true) {
        await f();
    }
}

// Catch key presses
readline.emitKeypressEvents(process.stdin);
if ('setRawMode' in process.stdin)
    process.stdin.setRawMode(true);

// Toggle pause on key press
let pause = false;
process.stdin.on('keypress', (str, key) => {
    if (key.name == 'space') {
        pause = !pause;
    }
});

// Parse args
buildParser(process.argv.slice(2), () => null);