import {Instagram} from "./instagram";
import {IOptions} from "./api";

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

export interface ISearchResult {
    users: ISearchResultUser[];
    places: any[]; // TODO write places spec
    hashtags: ISearchResultHashtag[];
    has_more: boolean;
    rank_token: string;
    clear_client_cache: boolean;
    status: string;
}

export type ISearchOptions = Pick<IOptions, Exclude<keyof IOptions, "total" | "fullAPI" | "hibernationTime" | "sleepTime">>

export class Search extends Instagram {
    private searchResult: ISearchResult;
    protected readonly catchURL = "https://www.instagram.com/web/search/topsearch/";

    constructor(query: string, options: ISearchOptions = {}) {
        super("https://instagram.com/explore/tags/puppies", query, "", "", options);
    }

    public async get() {
        if (!this.started) {
            await this.start();
        }
        await this.page.click("input[type='text']");
        await this.page.keyboard.type(this.id);
        await this.processRequests();
        await this.processResponses();
        await this.stop();
        return this.searchResult;
    }

    protected async processResponseData (data: ISearchResult) {
        this.searchResult = data;
    }
}