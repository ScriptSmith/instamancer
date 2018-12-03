#!/usr/bin/env node

import winston = require("winston");

import {Hashtag, Location, User, ApiOptions} from "./src/api"
import {download, toCSV, toJSON} from "./src/download";


/**
 * Build argument parser
 */
require('yargs')
    .command(
        'hashtag [id]',
        'Scrape a hashtag',
        {},
        async function f(args) {
            await spawn(args);
        }
    )
    .command(
        'location [id]',
        'Scrape a location',
        {},
        spawn
    )
    .command(
        'user [id]',
        'Scrape a user',
        {},
        spawn
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
            default: 'socialcreaper.log',
            describe: 'Name of the log file'
        }
    })
    .demandCommand()
    .argv;

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
                filename: args['logfile']
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
        logger: logger
    };

    // Start API
    logger.info("Starting API");
    let obj = new api(args['id'], options);
    await obj.start();

    // Download posts
    let posts = [];
    for await (let post of obj.itr()) {
        posts.push(post);
        if (args['download']) {
            download(post.node.thumbnail_src, post.node.shortcode, args['downdir'], () => {});
        }
    }

    let filename = args['filename'].replace('[id]', args['id']);

    if (args['filetype'] != 'json') {
        toCSV(posts, filename + '.csv');
    }
    if (args['filetype'] != 'csv') {
        toJSON(posts, filename + '.json');
    }
}

