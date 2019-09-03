import * as puppeteer from "puppeteer";
import * as instamancer from "..";
import {TFullApiPost, TPost, TSearchResult, TSinglePost} from "..";

export type DType = TPost | TSinglePost | TFullApiPost | TSearchResult;

export interface IPlugin {
    constructionEvent?(this: instamancer.Instagram<DType>): void;

    requestEvent?(
        this: instamancer.Instagram<DType>,
        req: puppeteer.Request,
        overrides: puppeteer.Overrides,
    ): void;

    responseEvent?(
        this: instamancer.Instagram<DType>,
        res: puppeteer.Response,
        data: DType,
    ): void;

    postPageEvent?(this: instamancer.Instagram<DType>, data: DType): void;

    graftingEvent?(this: instamancer.Instagram<DType>): void;
}
