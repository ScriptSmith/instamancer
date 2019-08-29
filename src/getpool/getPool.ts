import * as winston from "winston";

class GetJob {
    public finished: boolean = false;
    private readonly url: string;
    private readonly name: string;
    private readonly extension: string;
    private readonly downloadUpload: (
        url: string,
        name: string,
        extension: string,
    ) => Promise<void>;

    constructor(url: string, name: string, extension: string, downloadUpload) {
        this.url = url;
        this.name = name;
        this.extension = extension;
        this.downloadUpload = downloadUpload;
    }

    public async start() {
        await this.downloadUpload(this.url, this.name, this.extension);
        this.finished = true;
    }
}

/**
 * A pool of jobs that only executes k jobs 'simultaneously'
 */
export class GetPool {
    // Job promises
    public promises: Array<Promise<void>> = [];

    // Jobs that are currently being executed
    private runningJobs: GetJob[] = [];

    // Jobs that are yet to be executed
    private queuedJobs: GetJob[] = [];

    // Maximum number of jobs to be executed simultaneously
    private readonly maxConnections: number;

    // Looping interval executing promises
    private readonly loop;

    // Lock loop function execution
    private lock: boolean = false;

    // End-of-input signal triggered externally by close()
    private finished: boolean = false;

    // End-of-input resolve function
    private resolve: () => {};

    // Download / Upload function
    private readonly downloadUpload: (
        url: string,
        name: string,
        extension: string,
        directory: string,
        logger: winston.Logger,
    ) => Promise<void>;

    constructor(
        connections: number = 1,
        downloadUpload: (
            url: string,
            name: string,
            extension: string,
        ) => Promise<void>,
    ) {
        this.maxConnections = connections;
        this.loop = setInterval(() => {
            this.poolLoop.bind(this)();
        }, 100);
        this.downloadUpload = downloadUpload;
    }

    public add(url: string, name: string, extension: string) {
        this.queuedJobs.push(
            new GetJob(url, name, extension, this.downloadUpload),
        );
    }

    public close(resolve) {
        this.finished = true;
        this.resolve = resolve;
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
        while (
            this.queuedJobs.length > 0 &&
            this.runningJobs.length < this.maxConnections
        ) {
            const job = this.queuedJobs.shift();
            this.promises.push(job.start());
            this.runningJobs.push(job);
        }

        // End the interval when end-of-input signal given
        if (
            this.finished &&
            this.queuedJobs.length === 0 &&
            this.runningJobs.length === 0
        ) {
            clearInterval(this.loop);
            this.resolve();
        }

        // Release lock
        this.lock = false;
    }
}
