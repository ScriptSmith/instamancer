import * as fs from "fs";
import * as https from "https";
import * as json2csv from "json2csv";
import * as path from "path";

/**
 * Recursively create directories
 * @see https://stackoverflow.com/a/40686853/7435520
 * @param targetDir The path to create
 * @param isRelativeToScript Create path relative to this script
 */
function mkDirByPathSync(targetDir, {isRelativeToScript = false} = {}) {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : "";
    const baseDir = isRelativeToScript ? __dirname : ".";

    return targetDir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
        } catch (err) {
            if (err.code === "EEXIST") { // curDir already exists!
                return curDir;
            }

            // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
            if (err.code === "ENOENT") { // Throw the original parentDir error on curDir `ENOENT` failure.
                throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
            }

            const caughtErr = ["EACCES", "EPERM", "EISDIR"].indexOf(err.code) > -1;
            if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
                throw err; // Throw if it's just the last created dir.
            }
        }

        return curDir;
    }, initDir);
}

/**
 * Download file
 * @param url The URL of the file
 * @param name The name used to identify the file
 * @param directory The directory to save the file
 * @param callback Run upon completion
 */
export function download(url, name, directory, callback) {
    https.get(url, (response) => {
        mkDirByPathSync(directory);
        const file = fs.createWriteStream(directory + "/" + name);
        response.pipe(file);
        file.on("close", callback);
        file.on("finish", () => file.close());
    });
}

const fields = ["node.comments_disabled", "node.__typename", "node.id", "node.edge_media_to_caption.edges.0.node.text",
    "node.shortcode", "node.edge_media_to_comment.count", "node.taken_at_timestamp", "node.dimensions.height",
    "node.dimensions.width", "node.display_url", "node.edge_liked_by.count", "node.edge_media_preview_like.count",
    "node.owner.id", "node.thumbnail_src", "node.thumbnail_resources.0.src", "node.thumbnail_resources.0.config_width",
    "node.thumbnail_resources.0.config_height", "node.thumbnail_resources.1.src",
    "node.thumbnail_resources.1.config_width", "node.thumbnail_resources.1.config_height",
    "node.thumbnail_resources.2.src", "node.thumbnail_resources.2.config_width",
    "node.thumbnail_resources.2.config_height", "node.thumbnail_resources.3.src",
    "node.thumbnail_resources.3.config_width", "node.thumbnail_resources.3.config_height",
    "node.thumbnail_resources.4.src", "node.thumbnail_resources.4.config_width",
    "node.thumbnail_resources.4.config_height", "node.is_video", "node.video_view_count", "node.accessibility_caption"];

/**
 * Save list of posts to a CSV file
 */
export function toCSV(posts, filePath) {
    const parser = new json2csv.Parser({fields});
    const csv = parser.parse(posts);
    fs.writeFileSync(filePath, csv);
}

/**
 * Save list of posts to a JSON file
 */
export function toJSON(posts, filePath) {
    fs.writeFileSync(filePath, JSON.stringify(posts));
}
