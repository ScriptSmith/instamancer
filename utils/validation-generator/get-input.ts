import {writeFileSync} from "fs";
import {dirname, join} from "path";
import {createApi} from "../../";

const getPath = () => join(dirname(__filename), "./input.json");

const getResult = async () => {
  const posts = await getPosts({
    hashtagId: "beach",
    userId: "snoopdogg",
  });

  const singlePosts = await getSinglePosts({
    postsIds: [
      "BsOGulcndj-",
      "Be3rTNplCHf",
      "BlBvw2_jBKp",
      "Bi-hISIghYe",
      "BfzEfy-lK1N",
      "Bneu_dCHVdn",
      "Brx-adXA9C1",
      "BlTYHvXFrvm",
      "BmRZH7NFwi6",
      "BpiIJCUnYwy",
    ],
  });

  const searchResults = await getSearch({
    queries: ["beach", "nofilter", "donald"],
  });

  return {
    posts,
    searchResults,
    singlePosts,
  };
};

const getSearch = async ({queries}: {queries: string[]}) => {
  const result = [];
  const objects = queries.map((q) => createApi("search", q, {}));
  for (const object of objects) {
    result.push(await object.get());
  }
  return result;
};

const getPosts = async ({
  hashtagId,
  userId,
}: {
  hashtagId: string;
  userId: string;
}) => {
  const result = [];

  const options = {
    total: 10,
  };
  const objects = [
    createApi("hashtag", hashtagId, options),
    createApi("user", userId, options),
  ];

  for (const object of objects) {
    for await (const post of object.generator()) {
      result.push(post);
    }
  }
  return result;
};

const getSinglePosts = async ({postsIds}: {postsIds: string[]}) => {
  const result = [];
  const post = createApi("post", postsIds, {});
  for await (const singlePost of post.generator()) {
    result.push(singlePost);
  }
  return result;
};

const run = async () => {
  const result = await getResult();
  const json = JSON.stringify(result, null, 2);
  writeFileSync(getPath(), json, {
    encoding: "utf-8",
  });
};

// tslint:disable-next-line: no-console
run().catch(console.error);
