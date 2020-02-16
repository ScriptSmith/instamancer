import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import * as tmp from "tmp";
import {resolve, URL} from "url";
import * as winston from "winston";
import * as download from "./download";

interface IUpload {
    url: string;
    directory: string;
    logger: winston.Logger;
}

export async function depot(
    this: IUpload,
    url: string,
    name: string,
    extension: string,
) {
    try {
        // Axios download
        const downloadStream = await axios({
            method: "GET",
            responseType: "stream",
            url,
        });

        // Extract headers
        const contentType = downloadStream.headers["content-type"];
        const contentLength = downloadStream.headers["content-length"];

        // Upload path
        const filePath = path.join(this.directory, name + "." + extension);
        const uploadUrl = resolve(this.url, filePath);

        // Axios depot
        await axios({
            data: downloadStream.data,
            headers: {
                "Content-Length": contentLength,
                "Content-Type": contentType,
            },
            maxContentLength: Infinity,
            method: "PUT",
            ...authURL(uploadUrl),
        }).catch((error) => {
            this.logger.error(`Uploading ${url} failed`, error);
        });
    } catch (e) {
        this.logger.error(`Uploading ${url} failed`, e);
    }
}

function authURL(
    url: string,
): {url: string; auth: {username: string; password: string}} {
    const components = new URL(url);
    const auth = {
        password: components.password,
        username: components.username,
    };
    components.username = "";
    components.password = "";

    return {
        auth,
        url: components.toString(),
    };
}

async function uploadFile(
    this: IUpload,
    posts: object[],
    filePath: string,
    fileFunc: (posts: object[], filePath: string) => Promise<void>,
    contentType: string,
) {
    // Create tmp file
    const tmpFile = tmp.fileSync({keep: true});

    // Dump posts to file
    await fileFunc(posts, tmpFile.name);

    // Read file to a stream
    const fileStream = fs.createReadStream(tmpFile.name);
    const contentLength = fs.statSync(tmpFile.name).size;

    // Upload file
    const uploadUrl = resolve(this.url, filePath);
    await axios({
        data: fileStream,
        headers: {
            "Content-Length": contentLength,
            "Content-Type": contentType,
        },
        maxContentLength: Infinity,
        method: "PUT",
        url: uploadUrl,
    });

    // Delete file
    fs.unlinkSync(tmpFile.name);
}

/**
 * Upload list of posts to a CSV file
 */
export async function toCSV(this: IUpload, posts: object[], filePath: string) {
    const uploader = uploadFile.bind(this);
    await uploader(posts, filePath, download.toCSV, "text/csv");
}

/**
 * Upload list of posts to a JSON file
 */
export async function toJSON(this: IUpload, posts: object[], filePath: string) {
    const uploader = uploadFile.bind(this);
    await uploader(posts, filePath, download.toJSON, "text/json");
}
