import * as puppeteer from "puppeteer";
import * as instamancer from "..";
import {TFullApiPost, TPost, TSearchResult, TSinglePost} from "..";

export type DType = TPost | TSinglePost | TFullApiPost | TSearchResult;

export interface IPlugin {
    constructionEvent?(state: instamancer.Instagram<DType>): void;

    requestEvent?(
        req: puppeteer.Request,
        overrides: puppeteer.Overrides,
        state: instamancer.Instagram<DType>,
    ): void;

    responseEvent?(
        res: puppeteer.Response,
        data: DType,
        state: instamancer.Instagram<DType>,
    ): void;

    postPageEvent?(data: DType, state: instamancer.Instagram<DType>): void;

    graftingEvent?(state: instamancer.Instagram<DType>): void;
}
