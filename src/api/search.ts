import * as t from "io-ts";
import {IOptions} from "./api";
import {Instagram} from "./instagram";

export interface ISearchResultUser {
  position: number;
  user: {
    pk: string;
    username: string;
    full_name: string;
    is_private: boolean;
    profile_pic_url: string;
    profile_pic_id: string;
    is_verified: boolean;
    has_anonymous_profile_picture: boolean;
    follower_count: number;
    byline: string;
    mutual_followers_count: number;
    latest_reel_media: number;
    following: boolean;
    outgoing_request: boolean;
    seen: number;
  };
}

export interface ISearchResultHashtag {
  position: number;
  hashtag: {
    name: string;
    id: any;
    media_count: number;
    search_result_subtitle: string;
  };
}

export interface ISearchResultPlace {
  position: number;
  place: {
    location: {
      pk: string;
      name: string;
      address: string;
      city: string;
      short_name: string;
      lng: number;
      lat: number;
      external_source: string;
      facebook_places_id: number;
    };
    title: string;
    subtitle: string;
    media_bundles: any[];
    header_media: object;
    slug: string;
  };
}

export interface ISearchResult {
  users: ISearchResultUser[];
  places: ISearchResultPlace[];
  hashtags: ISearchResultHashtag[];
  has_more: boolean;
  rank_token: string;
  clear_client_cache: boolean;
  status: string;
}

export type ISearchOptions = Pick<
  IOptions,
  Exclude<keyof IOptions, "total" | "fullAPI" | "hibernationTime" | "sleepTime">
>;

export class Search extends Instagram<ISearchResult> {
  protected readonly catchURL = "https://www.instagram.com/web/";
  private searchResult: ISearchResult;
  private searchQuery: string;

  constructor(query: string, options: ISearchOptions = {}) {
    super(
      "https://instagram.com/explore/tags/instagram",
      "",
      "",
      "",
      options,
      t.type({}),
    );
    this.searchQuery = query;
  }

  public async get() {
    if (!this.started) {
      await this.start();
    }
    try {
      await this.page.click("input[type='text']");
      await this.page.keyboard.sendCharacter(this.searchQuery);
      await this.page.waitForRequest((req) => this.matchURL(req.url()));
      await this.processRequests();
      await this.page.waitForResponse((res) => this.matchURL(res.url()));
      await this.processResponses();
      await this.stop();
      return this.searchResult;
    } catch (e) {
      this.forceStop();
      throw e;
    }
  }

  protected matchURL(url: string) {
    return url.startsWith(this.catchURL);
  }

  protected async processResponseData(data: ISearchResult) {
    this.searchResult = data;
  }
}
