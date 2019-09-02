import {createApi} from "./src/api/api";

export {
    Hashtag,
    Post,
    User,
    IOptions,
    createApi,
    IOptionsCommon,
    IOptionsFullApi,
    IOptionsRegular,
} from "./src/api/api";
export {Instagram} from "./src/api/instagram";
export {TSearchResult, ISearchOptions} from "./src/api/search";
export {TPost, TSinglePost, TFullApiPost} from "./src/api/types";

export * from "./plugins";
