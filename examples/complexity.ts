import * as instamancer from "instamancer";
import {Response} from "puppeteer";

class Complexity<PostType> implements instamancer.IPlugin<PostType> {
    private query: string;

    constructor(query: string) {
        this.query = query;
    }

    public responseEvent(
        this: instamancer.IPluginContext<Complexity<PostType>, PostType>,
        res: Response,
        data: {[key: string]: any},
    ): void {
        this.state.page
            .evaluate((query) => {
                return document.querySelectorAll(query).length;
            }, this.plugin.query)
            .then((count) => {
                process.stdout.write(
                    `${this.plugin.query} elements: ${count}\n`,
                );
            });
    }
}

const user = instamancer.createApi("user", "therock", {
    enableGrafting: false,
    plugins: [
        new Complexity("div"),
        new Complexity("span"),
        new Complexity("img"),
    ],
    silent: true,
    total: 500,
});

(async () => {
    const posts: instamancer.TPost[] = [];
    for await (const post of user.generator()) {
        posts.push(post);
    }

    process.stdout.write(`Total posts ${posts.length}`);
})();
