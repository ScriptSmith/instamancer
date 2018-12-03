import * as https from "https";
import * as fs from "fs";
import * as json2csv from "json2csv";

const path = require('path');

function mkDirByPathSync(targetDir, {isRelativeToScript = false} = {}) {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    const baseDir = isRelativeToScript ? __dirname : '.';

    return targetDir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
        } catch (err) {
            if (err.code === 'EEXIST') { // curDir already exists!
                return curDir;
            }

            // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
            if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
                throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
            }

            const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
            if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
                throw err; // Throw if it's just the last created dir.
            }
        }

        return curDir;
    }, initDir);
}

export function download(url, name, directory, callback) {
    https.get(url, response => {
        mkDirByPathSync(directory);
        let file = fs.createWriteStream(directory + '/' + name);
        response.pipe(file);
        file.on('close', callback);
        file.on('finish', () => file.close());
    })
}

export function toCSV(data, path) {
    let parser = new json2csv.Parser();
    let csv = parser.parse(data);
    console.log(csv)
}


