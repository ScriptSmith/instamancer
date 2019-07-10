import * as winston from "winston";
import {Instagram} from "./instagram";
import {Post as PostValidator, SinglePost, TPost, TSinglePost} from "./types";

/**
 * Optional arguments for the API
 */
export interface IOptions {
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

  // Throw an error if type validation has been failed
  strict?: boolean;
}

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

/**
 * An Instagram hashtag API wrapper
 */
export class Hashtag extends Instagram<TPost> {
  constructor(id: string, options: IOptions = {}) {
    const endpoint = "https://instagram.com/explore/tags/";
    const pageQuery = "data.hashtag.edge_hashtag_to_media.page_info";
    const edgeQuery = "data.hashtag.edge_hashtag_to_media.edges";
    super(endpoint, id, pageQuery, edgeQuery, options, PostValidator);
  }
}

/**
 * An Instagram location API wrapper
 */
export class Location extends Instagram<TPost> {
  constructor(id: string, options: IOptions = {}) {
    const endpoint = "https://instagram.com/explore/locations/";
    const pageQuery = "data.location.edge_location_to_media.page_info";
    const edgeQuery = "data.location.edge_location_to_media.edges";
    super(endpoint, id, pageQuery, edgeQuery, options, PostValidator);
  }
}

/**
 * An Instagram user API wrapper
 */
export class User extends Instagram<TPost> {
  constructor(id: string, options: IOptions = {}) {
    const endpoint = "https://instagram.com/";
    const pageQuery = "data.user.edge_owner_to_timeline_media.page_info";
    const edgeQuery = "data.user.edge_owner_to_timeline_media.edges";
    super(endpoint, id, pageQuery, edgeQuery, options, PostValidator);
  }
}
