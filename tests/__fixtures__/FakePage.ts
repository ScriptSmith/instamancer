import * as t from "io-ts";
import {IOptions} from "../../src/api/api";
import {Instagram} from "../../src/api/instagram";

export interface IFakePageOptions {
    // The path on the server
    path?: string;

    // The port the server is hosted on
    port?: number;

    // The query to get API pages
    pageQuery?: string;

    // The query to get posts
    edgeQuery?: string;

    // The page to catch api requests on
    catchPage?: string;

    // The page to visit posts
    postPage?: string;

    // Regular API options
    options?: IOptions;
}

const FakeValidator = t.type({
    node: t.type({
        id: t.string,
    }),
});

export class FakePage extends Instagram<t.TypeOf<typeof FakeValidator>> {
    constructor(options: IFakePageOptions = {path: "", port: 0}) {
        let baseURL = "http://127.0.0.1:" + options.port;
        if (options.path) {
            baseURL += options.path;
        }

        const silentOptions: IOptions = {silent: true};
        super(
            baseURL,
            "",
            options.pageQuery,
            options.edgeQuery,
            {
                ...options.options,
                ...silentOptions,
            },
            FakeValidator,
        );

        this.catchURL = baseURL + "/" + options.catchPage;
        this.postURL = baseURL + "/" + options.postPage;

        setTimeout(async () => {
            await this.forceStop();
        }, 30000);
    }
}
