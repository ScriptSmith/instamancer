import axios from "axios";
import * as fs from "fs";
import * as mkdirp from "mkdirp";
import * as winston from "winston";

class GetJob {

    public finished: boolean = false;
    private readonly url: string;
    private logger: winston.Logger;
    private readonly name: string;
    private readonly extension: string;
    private readonly directory: string;

    constructor(url: string, name: string, extension: string, directory: string,
                logger: winston.Logger) {
        this.url = url;
        this.name = name;
        this.extension = extension;
        this.directory = directory;
        this.logger = logger;
    }

    public async start() {
        mkdirp.sync(this.directory);
        try {
            await axios({
                method: "get",
                responseType: "stream",
                url: this.url,
            }).then((response) => {
                // noinspection TypeScriptValidateJSTypes
                response.data.pipe(fs.createWriteStream(this.directory + "/" + this.name + "." + this.extension));
            });
        } catch (e) {
            this.logger.info(`Downloading ${this.url} failed`);
            this.logger.debug(e);
        }
        this.finished = true;
    }
}

/**
 * A pool of jobs that only executes k jobs 'simultaneously'
 */
class GetPool {
    // Jobs that are currently being executed
    private runningJobs: GetJob[];

    // Jobs that are yet to be executed
    private queuedJobs: GetJob[];

    // Maximum number of jobs to be executed simultaneously
    private readonly maxConnections: number;

    // Looping interval executing promises
    private readonly loop;

    // Lock loop function execution
    private lock: boolean = false;

    // End-of-input signal triggered externally by close()
    private finished: boolean = false;

    constructor(connections: number = 8) {
        this.maxConnections = connections;
        this.loop = setInterval(this.poolLoop, 100);
    }

    public add(job: GetJob) {
        this.queuedJobs.push(job);
    }

    public close() {
        this.finished = true;
    }

    private poolLoop() {
        // Obtain lock or cancel
        if (this.lock) {
            return;
        } else {
            this.lock = true;
        }

        // Remove finished jobs
        for (let i = 0; i < this.runningJobs.length; i++) {
            if (this.runningJobs[i].finished) {
                this.runningJobs.splice(i);
                i = 0;
            }
        }

        // Add new jobs to empty running slots
        while (this.runningJobs.length < this.maxConnections) {
            const promise = this.queuedJobs.shift();
            promise.start();
            this.runningJobs.push(promise);
        }

        // End the interval when end-of-input signal given
        if (this.finished && this.queuedJobs.length === 0 && this.runningJobs.length === 0) {
            clearInterval(this.loop);
        }

        // Release lock
        this.lock = false;
    }
}
