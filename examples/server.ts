import express from "express";
import * as instamancer from "instamancer";

const app = express();
const port = 3000;

async function getPosts(tag: string): Promise<instamancer.TPost[]> {
    const hashtag = instamancer.createApi("hashtag", tag, {
        total: 5,
    });
    const posts = [];

    for await (const post of hashtag.generator()) {
        posts.push(post);
    }

    return posts;
}

let cachedPosts: instamancer.TPost[] = [];

async function getCached() {
    cachedPosts = await getPosts("puppies");
}
setTimeout(getCached, 3000);

app.get("/cached", async (req, res) => {
    res.json(cachedPosts);
});

app.get("/live", async (req, res) => {
    if ("tag" in req.params) {
        const posts = await getPosts(req.params.tag);
        res.json(posts);
    }
});

app.listen(port, () =>
    process.stdout.write(`Example app listening on port ${port}!\n`),
);
