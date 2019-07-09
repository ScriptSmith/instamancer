import axios from "axios";
import concat from "concat-stream";
import {storage} from "pkgcloud";
import {Stream} from "stream";
import * as winston from "winston";

interface IUpload {
  client: storage.Client;
  directory: string;
  logger: winston.Logger;
}

export async function upload(
  this: IUpload,
  url: string,
  name: string,
  extension: string,
) {
  try {
    // Swift upload
    const uploadStream = this.client.upload({
      container: this.directory,
      remote: name + "." + extension,
    });

    // Axios download
    const downloadStream = await axios({
      method: "get",
      responseType: "stream",
      url,
    });

    await new Promise((resolve) => {
      // Download stream -> buffer -> piped to uploadStream
      downloadStream.data.pipe(
        concat((buffer) => {
          const bufferStream = new Stream.PassThrough();
          bufferStream.end(buffer);
          bufferStream.pipe(uploadStream);

          uploadStream.on("success", resolve);
        }),
      );
    });
  } catch (e) {
    this.logger.info(`Downloading ${url} failed`);
    this.logger.debug(e);
  }
}
