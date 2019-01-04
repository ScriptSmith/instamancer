import axios from "axios";
import * as fs from "fs";
import * as json2csv from "json2csv";
import * as mkdirp from "mkdirp";

/**
 * Download file
 * @param url The URL of the file
 * @param name The name used to identify the file
 * @param directory The directory to save the file
 * @param logger Logging object
 */
export async function download(url, name, directory, logger) {
    mkdirp.sync(directory);
    try {
        await axios({
            method: "get",
            responseType: "stream",
            url,
        }).then((response) => {
            // noinspection TypeScriptValidateJSTypes
            response.data.pipe(fs.createWriteStream(directory + "/" + name));
        });
    } catch (e) {
        logger.info(`Downloading ${url} failed`);
        logger.debug(e);
    }
}

/**
 * Save list of posts to a CSV file
 */
export function toCSV(posts, filePath) {
    const parser = new json2csv.Parser({flatten: true});
    const csv = parser.parse(posts);
    fs.writeFileSync(filePath, csv);
}

/**
 * Save list of posts to a JSON file
 */
export function toJSON(posts, filePath) {
    let first = true;
    fs.writeFileSync(filePath, "[");
    for (const post of posts) {
        if (first) {
            first = false;
        } else {
            fs.appendFileSync(filePath, ", ");
        }
        fs.appendFileSync(filePath, JSON.stringify(post));
    }
    fs.appendFileSync(filePath, "]");
}
