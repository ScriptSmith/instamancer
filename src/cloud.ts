import axios from "axios";
import concat from "concat-stream";
import {ProviderOptions, storage} from "pkgcloud";
import {Stream} from "stream";
import * as winston from "winston";

interface IUpload {
  client: storage.Client;
}

async function upload(
  this: IUpload,
  url: string,
  name: string,
  extension: string,
  directory: string,
  logger: winston.Logger,
) {
  try {
    // Swift upload
    const uploadStream = this.client.upload({
      container: directory,
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
    logger.info(`Downloading ${url} failed`);
    logger.debug(e);
  }
}

export function getUploadFunction(clientOptions: ProviderOptions) {
  const client = storage.createClient(clientOptions);
  return upload.bind({client});
}
