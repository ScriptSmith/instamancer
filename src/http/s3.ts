import * as aws from "aws-sdk";
import axios from "axios";
import * as fs from "fs";
import * as tmp from "tmp";
import * as winston from "winston";
import * as download from "./download";

interface IUpload {
    bucket: string;
    directory: string;
    s3: aws.S3;
    logger: winston.Logger;
}

export async function s3(
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

        // s3 upload
        await new Promise((resolve) => {
            this.s3.upload(
                {
                    Body: downloadStream.data,
                    Bucket: this.bucket,
                    ContentLength: contentLength,
                    ContentType: contentType,
                    Key: this.directory + "/" + name + "." + extension,
                },
                (err) => {
                    if (err !== null) {
                        this.logger.error(`Uploading ${url} failed`, err);
                    }
                    resolve();
                },
            );
        });
    } catch (e) {
        this.logger.error(`Uploading ${url} failed`, e);
    }
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

    // s3 upload
    await new Promise((resolve) => {
        this.s3.upload(
            {
                Body: fileStream,
                Bucket: this.bucket,
                ContentLength: contentLength,
                ContentType: contentType,
                Key: filePath,
            },
            (err) => {
                if (err !== null) {
                    this.logger.error(`Uploading ${filePath} failed`, err);
                }
                resolve();
            },
        );
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
