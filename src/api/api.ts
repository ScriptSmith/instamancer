import * as winston from "winston";
import {Instagram} from "./instagram";
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

export function createApi(type: "post", id: string[], options: IOptions): Post;
export function createApi(
  type: "hashtag" | "user" | "location",
  id: string,
  options: IOptionsRegular,
): Hashtag<TPost> | User<TPost> | Location<TPost>;
export function createApi(
  type: "hashtag" | "user" | "location",
  id: string,
  options: IOptionsFullApi,
): Hashtag<TFullApiPost> | User<TFullApiPost> | Location<TFullApiPost>;
export function createApi(
  type: "hashtag" | "user" | "location" | "post",
  id: string | string[],
  options: IOptions,
):
  | Post
  | Hashtag<TPost>
  | User<TPost>
  | Location<TPost>
  | Hashtag<TFullApiPost>
  | User<TFullApiPost>
  | Location<TFullApiPost> {
  let ClassConstructor: typeof Hashtag | typeof User | typeof Location;
  switch (type) {
    case "post":
      return new Post(id as string[], options);
    case "hashtag":
      ClassConstructor = Hashtag;
      break;
    case "user":
      ClassConstructor = User;
      break;
    case "location":
      ClassConstructor = Location;
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
 * An Instagram location API wrapper
 */
export class Location<T> extends Instagram<T> {
  constructor(id: string, options: IOptions = {}) {
    const endpoint = "https://instagram.com/explore/locations/";
    const pageQuery = "data.location.edge_location_to_media.page_info";
    const edgeQuery = "data.location.edge_location_to_media.edges";
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
