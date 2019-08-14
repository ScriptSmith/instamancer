#!/usr/bin/env node

import * as fs from "fs";
import * as readline from "readline";
import * as winston from "winston";

import * as path from "path";
import {storage} from "pkgcloud";
import {createApi, IOptions} from "./api/api";
import {Instagram} from "./api/instagram";
import {TFullApiPost, TPost, TSinglePost} from "./api/types";
import {upload} from "./cloud";
import {download, toCSV, toJSON} from "./download";
import {GetPool} from "./getpool/getPool";

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
    .command("user [id]", "Scrape a user", {}, async (handleArgs) => {
      await spawn(handleArgs);
      callback();
    })
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
                  () => new Promise((res) => buildParser(line, res)),
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
        describe:
          "Get the full list of posts and their details from the API and web page",
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
      strict: {
        boolean: true,
        default: false,
        describe:
          "Throw an error if types from Instagram API have been changed",
      },
      sync: {
        boolean: true,
        default: false,
        describe: "Synchronously download files between API requests",
      },
      threads: {
        alias: "k",
        number: true,
        default: 4,
        describe: "The number of parallel download / upload threads",
      },
      waitDownload: {
        alias: "w",
        boolean: true,
        default: false,
        describe:
          "When true, media will only download once scraping is finished",
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
        describe: "Directory / Container to save media",
      },
      mediaPath: {
        alias: "mp",
        boolean: true,
        default: false,
        describe: "Store the paths of downloaded media in the '_mediaPath' key",
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
      browser: {
        default: undefined,
        describe:
          "Location of the browser. Defaults to the copy downloaded at installation",
      },
      swift: {
        boolean: true,
        default: false,
        describe:
          "Upload media to openstack's swift object storage rather than saving to disk",
      },
    })
    .demandCommand()
    .example(
      "$0 hashtag instagood -d",
      "Download all the available posts, and their thumbnails from #instagood",
    )
    .example(
      "$0 user arianagrande --filetype=csv --logging=info --visible",
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
  let ids;
  if (args["_"][0] === "post") {
    ids = args["ids"].split(",");
    args["id"] = ids.length === 1 ? ids[0] : "posts";
    args["full"] = true;
  } else {
    ids = args["id"];
  }

  // Define options
  const options: IOptions = {
    total: args["count"],
    headless: !args["visible"],
    logger,
    silent: args["silent"],
    strict: args["strict"],
    sleepTime: 2,
    enableGrafting: args["graft"],
    fullAPI: args["full"],
    executablePath: args["browser"],
  };

  // Replace downdir
  const downdir = args["downdir"]
    .replace("[id]", args["id"])
    .replace("[endpoint]", args["_"]);

  // Connect to object storage
  let downloadUpload;
  if (args["swift"]) {
    // Upload
    const client = storage.createClient({
      authUrl: process.env.OS_AUTH_URL,
      password: process.env.OS_PASSWORD,
      // @ts-ignore
      provider: "openstack",
      region: process.env.OS_REGION_NAME,
      username: process.env.OS_USERNAME,
    });

    downloadUpload = upload.bind({
      client,
      directory: downdir,
      logger,
    });
  } else {
    // Download
    downloadUpload = download.bind({
      directory: downdir,
      logger,
    });
  }

  // Start API
  logger.info("Starting API at " + Date.now());
  const obj: Instagram<TPost | TFullApiPost | TSinglePost> = createApi(
    args["_"][0],
    ids,
    options,
  );
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
        const children = postObject.shortcode_media.edge_sidecar_to_children;
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
            mediaUrl = postObject.shortcode_media.display_resources.pop().src;
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
  const filename = args["filename"]
    .replace("[id]", args["id"])
    .replace("[endpoint]", args["_"]);

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
