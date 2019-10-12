import * as puppeteer from "puppeteer";
import {Instagram, TFullApiPost, TPost, TSearchResult, TSinglePost} from "..";

export type DType = TPost | TSinglePost | TFullApiPost | TSearchResult;

export interface IPluginContext<Plugin, PostType> {
    plugin: Plugin;
    state: Instagram<PostType>;
}

export interface IPlugin<PostType> {
    constructionEvent?(this: IPluginContext<IPlugin<PostType>, PostType>): void;

    requestEvent?(
        this: IPluginContext<IPlugin<PostType>, PostType>,
        req: puppeteer.Request,
        overrides: puppeteer.Overrides,
    ): Promise<void>;

    responseEvent?(
        this: IPluginContext<IPlugin<PostType>, PostType>,
        res: puppeteer.Response,
        data: {[key: string]: any},
    ): Promise<void>;

    postPageEvent?(
        this: IPluginContext<IPlugin<PostType>, PostType>,
        data: PostType,
    ): Promise<void>;

    graftingEvent?(
        this: IPluginContext<IPlugin<PostType>, PostType>,
    ): Promise<void>;
}

export enum AsyncPluginEvents {
    browser,
    grafting,
    postPage,
    request,
    response,
}

export type AsyncPluginEventsType = keyof typeof AsyncPluginEvents;

export enum SyncPluginEvents {
    construction,
}

export type SyncPluginEventsType = keyof typeof SyncPluginEvents;

export type PluginEventsType = SyncPluginEventsType | AsyncPluginEventsType;
