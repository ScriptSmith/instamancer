import {writeFileSync} from "fs";
import {dirname, join} from "path";
import * as Instamancer from "../../";

const getPath = () => join(dirname(__filename), "./input.json");

const getResult = async () => {
  const posts = await getPosts({
    hashtagId: "beach",
    locationId: "1110037669039751",
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

  return {
    posts,
    singlePosts,
  };
};

const getPosts = async ({
  hashtagId,
  userId,
  locationId,
}: {
  hashtagId: string;
  userId: string;
  locationId: string;
}) => {
  const result = [];

  const options = {
    total: 10,
  };
  const objects = [
    new Instamancer.Hashtag(hashtagId, options),
    new Instamancer.User(userId, options),
    new Instamancer.Location(locationId, options),
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
  const post = new Instamancer.Post(postsIds, {});
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
