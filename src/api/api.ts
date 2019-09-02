import {Type} from "io-ts";
import * as winston from "winston";
import {IPlugin} from "../../plugins/plugin";
import {Instagram} from "./instagram";
import {ISearchOptions, Search} from "./search";
import {
    FullApiPost,
    Post as PostValidator,
    SinglePost,
    TFullApiPost,
    TPost,
    TSinglePost,
} from "./types";

/**
 * Optional arguments for the API
 */
export interface IOptionsCommon {
    // Total posts to download. 0 for unlimited
    total?: number;

    // Run Chrome in headless mode
    headless?: boolean;

    // Logging events
    logger?: winston.Logger;

    // Run without output to stdout
    silent?: boolean;

    // Time to sleep between interactions with the page
    sleepTime?: number;

    // Throw an error if type validation has been failed
    strict?: boolean;

    // Time to sleep when rate-limited
    hibernationTime?: number;

    // Enable the grafting process
    enableGrafting?: boolean;

    // Extract the full amount of information from the API
    fullAPI?: boolean;

    // Use a proxy in Chrome to connect to Instagram
    proxyURL?: string;

    // Location of the chromium / chrome binary executable
    executablePath?: string;

    // Custom io-ts validator
    validator?: Type<unknown>;

    // Custom plugins
    plugins?: IPlugin[];
}

export interface IOptionsFullApi extends IOptionsCommon {
    fullAPI: true;
}

export interface IOptionsRegular extends IOptionsCommon {
    fullAPI?: false;
}

export type IOptions = IOptionsFullApi | IOptionsRegular;

/**
 * An Instagram post API wrapper
 */
export class Post extends Instagram<TSinglePost> {
    // Post ids
    private readonly ids: string[];

    constructor(ids: string[], options: IOptions = {}) {
        // fullAPI option makes no sense for Post class
        // But usage with fullAPI option brings an extra post, because of scrapeDefaultPosts
        // So we force it to be disabled
        options.fullAPI = false;
        super("https://instagram.com/p/", ids[0], "", "", options, SinglePost);
        this.ids = ids;
    }

    /**
     * Get the post metadata
     */
    protected async getNext() {
        for (const id of this.ids) {
            this.id = id;
            await this.postPage(id, 1);
            await this.sleep(1);
        }
        this.finished = true;
    }
}

const getPageValidator = (options: IOptions) =>
    options.fullAPI ? FullApiPost : PostValidator;

export type InstagramPostClass = Hashtag<TPost> | User<TPost>;
export type InstagramFullPostClass = Hashtag<TFullApiPost> | User<TFullApiPost>;

export function createApi(
    type: "search",
    query: string,
    options?: ISearchOptions,
): Search;
export function createApi(type: "post", id: string[], options?: IOptions): Post;
export function createApi(
    type: "hashtag" | "user",
    id: string,
    options?: IOptionsRegular,
): InstagramPostClass;
export function createApi(
    type: "hashtag" | "user",
    id: string,
    options?: IOptionsFullApi,
): InstagramFullPostClass;
export function createApi(
    type: "hashtag" | "user" | "post" | "search",
    id: string | string[],
    options?: IOptions,
): Post | InstagramPostClass | InstagramFullPostClass | Search {
    let ClassConstructor: typeof Hashtag | typeof User;
    switch (type) {
        case "search":
            return new Search(id as string, options as ISearchOptions);
        case "post":
            return new Post(id as string[], options);
        case "hashtag":
            ClassConstructor = Hashtag;
            break;
        case "user":
            ClassConstructor = User;
            break;
    }
    if (options.fullAPI) {
        return new ClassConstructor<TFullApiPost>(id as string, options);
    }
    return new ClassConstructor<TPost>(id as string, options);
}

/**
 * An Instagram hashtag API wrapper
 */
export class Hashtag<T> extends Instagram<T> {
    constructor(id: string, options: IOptions = {}) {
        const endpoint = "https://instagram.com/explore/tags/";
        const pageQuery = "data.hashtag.edge_hashtag_to_media.page_info";
        const edgeQuery = "data.hashtag.edge_hashtag_to_media.edges";
        super(
            endpoint,
            id,
            pageQuery,
            edgeQuery,
            options,
            getPageValidator(options),
        );
    }
}

/**
 * An Instagram user API wrapper
 */
export class User<T> extends Instagram<T> {
    constructor(id: string, options: IOptions = {}) {
        const endpoint = "https://instagram.com/";
        const pageQuery = "data.user.edge_owner_to_timeline_media.page_info";
        const edgeQuery = "data.user.edge_owner_to_timeline_media.edges";
        super(
            endpoint,
            id,
            pageQuery,
            edgeQuery,
            options,
            getPageValidator(options),
        );
    }
}
