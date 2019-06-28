import {Hashtag, IOptions, Location, Post, User, Search, ISearchResult, ISearchResultHashtag, ISearchResultUser, ISearchOptions} from "./src/api/api";

export {Hashtag, Location, Post, User, IOptions, Search, ISearchResult, ISearchResultHashtag, ISearchResultUser, ISearchOptions} from "./src/api/api";

export function hashtag(id, options: IOptions) {
    return new Hashtag(id, options).generator();
}

export function location(id, options: IOptions) {
    return new Location(id, options).generator();
}

export function user(id, options: IOptions) {
    return new User(id, options).generator();
}

export function post(ids, options: IOptions) {
    return new Post(ids, options).generator();
}

export function search(query: string, options: ISearchOptions): Promise<ISearchResult> {
    return new Search(query, options).get();
}