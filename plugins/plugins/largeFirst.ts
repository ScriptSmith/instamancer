import {Overrides, Request} from "puppeteer";
import * as querystring from "querystring";
import {format as urlFormat, parse as urlParse} from "url";
import {IPlugin, IPluginContext} from "../plugin";

export class LargeFirst<PostType> implements IPlugin<PostType> {
    public constructionEvent(
        this: IPluginContext<IPlugin<PostType>, PostType>,
    ): void {
        this.state.jumpSize = 150;
    }

    public requestEvent(req: Request, overrides: Overrides): void {
        const url = overrides["url"] ? overrides["url"] : req.url();
        const parsedUrl = urlParse(url);
        const query = querystring.parse(parsedUrl.query);
        const variables = JSON.parse(query["variables"] as string);

        variables.first = 50;

        query.variables = JSON.stringify(variables);
        parsedUrl.search = "?" + querystring.stringify(query);
        overrides["url"] = urlFormat(parsedUrl);
    }
}
