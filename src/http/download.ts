import axios from "axios";
import * as fs from "fs";
import * as json2csv from "json2csv";
import * as winston from "winston";

interface IDownload {
    directory: string;
    logger: winston.Logger;
}

/**
 * Download file
 * @param url The URL of the file
 * @param name The name used to identify the file
 * @param extension The file extension (eg. ".jpg" or ".mp4")
 */
export async function download(
    this: IDownload,
    url: string,
    name: string,
    extension: string,
) {
    await new Promise((resolve) => {
        fs.mkdir(this.directory, {recursive: true}, resolve);
    });
    try {
        // Get data
        const response = await axios({
            method: "get",
            responseType: "stream",
            url,
        });

        // Write to file
        await new Promise(async (resolve) => {
            const stream = fs.createWriteStream(
                this.directory + "/" + name + "." + extension,
            );
            // noinspection TypeScriptValidateJSTypes
            response.data.pipe(stream);
            stream.on("finish", resolve);
        });
    } catch (e) {
        this.logger.info(`Downloading ${url} failed`);
        this.logger.debug(e);
    }
}

/**
 * Save list of posts to a CSV file
 */
export async function toCSV(posts: object[], filePath: string) {
    const parser = new json2csv.Parser({flatten: true});
    const csv = parser.parse(posts);
    fs.writeFileSync(filePath, csv);
}

/**
 * Save list of posts to a JSON file
 */
export async function toJSON(posts: object[], filePath: string) {
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
