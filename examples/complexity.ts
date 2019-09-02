import * as instamancer from "instamancer";
import {DType, Instagram, TPost} from "instamancer";
import * as puppeteer from "puppeteer";

class Complexity implements instamancer.IPlugin {
    public responseEvent(
        res: puppeteer.Response,
        data: DType,
        state: Instagram<DType>,
    ): void {
        state.page
            .evaluate(() => {
                return document.getElementsByTagName("*").length;
            })
            .then((count) => {
                process.stdout.write(`Page elements: ${count}\n`);
            });
    }
}

const user = instamancer.createApi("user", "therock", {
    enableGrafting: false,
    plugins: [new Complexity()],
    silent: true,
    total: 500,
});

(async () => {
    const posts: TPost[] = [];
    for await (const post of user.generator()) {
        posts.push(post);
    }

    process.stdout.write(`Total posts ${posts.length}`);
})();
