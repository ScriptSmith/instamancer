import * as t from "io-ts";
import {excess} from "io-ts-excess";
import {IPlugin} from "../../plugins";
import {IOptions} from "./api";
import {Instagram} from "./instagram";

export const Users = t.type({
    position: t.number,
    user: excess(
        t.type({
            full_name: t.string,
            has_anonymous_profile_picture: t.boolean,
            is_private: t.boolean,
            is_verified: t.boolean,
            latest_reel_media: t.number,
            mutual_followers_count: t.number,
            pk: t.string,
            profile_pic_id: t.union([t.string, t.undefined]),
            profile_pic_url: t.string,
            username: t.string,
        }),
    ),
});

export const Places = t.type({
    place: excess(
        t.type({
            header_media: t.any,
            location: excess(
                t.type({
                    address: t.string,
                    city: t.string,
                    external_source: t.string,
                    facebook_places_id: t.number,
                    lat: t.union([t.undefined, t.number]),
                    lng: t.union([t.undefined, t.number]),
                    name: t.string,
                    pk: t.string,
                    short_name: t.string,
                }),
            ),
            media_bundles: t.UnknownArray,
            slug: t.string,
            subtitle: t.string,
            title: t.string,
        }),
    ),
    position: t.number,
});

export const Hashtags = t.type({
    hashtag: excess(
        t.type({
            id: t.number,
            media_count: t.number,
            name: t.string,
            profile_pic_url: t.string,
            search_result_subtitle: t.string,
            use_default_avatar: t.boolean,
        }),
    ),
    position: t.number,
});

export const SearchResult = t.type({
    clear_client_cache: t.boolean,
    has_more: t.boolean,
    hashtags: t.array(Hashtags),
    places: t.array(Places),
    rank_token: t.string,
    status: t.string,
    users: t.array(Users),
});

export type TSearchResult = t.TypeOf<typeof SearchResult>;

export type ISearchOptions = Pick<
    IOptions,
    Exclude<
        keyof IOptions,
        "total" | "fullAPI" | "hibernationTime" | "sleepTime"
    >
>;

export interface ISearchOptionsPlugins<PostType> extends ISearchOptions {
    plugins?: IPlugin<PostType>[];
}

export class Search extends Instagram<TSearchResult> {
    public readonly catchURL = "https://www.instagram.com/web/";
    private searchResult: TSearchResult;
    private readonly searchQuery: string;
    private readonly inputElementQuery: string = "input[type='text']";

    constructor(query: string, options: ISearchOptions = {}) {
        super(
            "https://instagram.com/explore/tags/instagram",
            "",
            "",
            "",
            options,
            SearchResult,
        );
        this.searchQuery = query;
    }

    public async get() {
        if (!this.started) {
            await this.start();
        }
        try {
            try {
                await this.page.waitForSelector(this.inputElementQuery, {
                    timeout: 30000,
                });
            } catch {
                // Timeout
            }
            await this.page.click(this.inputElementQuery);

            await this.page.keyboard.sendCharacter(this.searchQuery);
            await this.page.waitForRequest((req) => this.matchURL(req.url()));
            await this.processRequests();
            await this.page.waitForResponse((res) => this.matchURL(res.url()));
            await this.processResponses();
        } catch (e) {
            await this.stop();
            throw e;
        }
        await this.stop();
        return this.searchResult;
    }

    public matchURL(url: string) {
        return url.startsWith(this.catchURL);
    }

    protected async processResponseData(data: TSearchResult) {
        await this.validatePost(data);
        this.searchResult = data;
    }
}
