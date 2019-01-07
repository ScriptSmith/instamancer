import axios from "axios";
import * as fs from "fs";
import * as json2csv from "json2csv";
import * as mkdirp from "mkdirp";
import * as winston from "winston";

/**
 * Download file
 * @param url The URL of the file
 * @param name The name used to identify the file
 * @param extension The file extension (eg. ".jpg" or ".mp4")
 * @param directory The directory to save the file
 * @param logger Logging object
 */
export async function download(url: string, name: string, extension: string, directory: string,
                               logger: winston.Logger) {
    mkdirp.sync(directory);
    try {
        await axios({
            method: "get",
            responseType: "stream",
            url,
        }).then((response) => {
            // noinspection TypeScriptValidateJSTypes
            response.data.pipe(fs.createWriteStream(directory + "/" + name + "." + extension));
        });
    } catch (e) {
        logger.info(`Downloading ${url} failed`);
        logger.debug(e);
    }
}

/**
 * Save list of posts to a CSV file
 */
export function toCSV(posts: object[], filePath: string) {
    const parser = new json2csv.Parser({flatten: true});
    const csv = parser.parse(posts);
    fs.writeFileSync(filePath, csv);
}

/**
 * Save list of posts to a JSON file
 */
export function toJSON(posts: object[], filePath: string) {
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
