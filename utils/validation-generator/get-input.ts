import * as Instamancer from "../../";
import { writeFileSync } from "fs";
import { join, dirname } from "path";

const getPath = () => join(dirname(__filename), "./input.json");

const getResult = async () => {
    const posts = await getPosts({
        hashtagId: "beach",
        locationId: "1110037669039751",
        userId: "snoopdogg",
        postsIds: ["BsOGulcndj-", "Be3rTNplCHf", "BlBvw2_jBKp", "Bi-hISIghYe", "BfzEfy-lK1N", "Bneu_dCHVdn", "Brx-adXA9C1",
        "BlTYHvXFrvm", "BmRZH7NFwi6", "BpiIJCUnYwy"]
    });

    return {
        posts,
    }
}

const getPosts = async ({hashtagId, userId, locationId, postsIds}: {
    hashtagId: string,
    userId: string,
    locationId: string,
    postsIds: string[]
}) => {
    const result = [];

    const options = {
        total: 10,
    }
    const objects = [
        new Instamancer.Hashtag(hashtagId, options),
        new Instamancer.User(userId, options),
        new Instamancer.Location(locationId, options),
        new Instamancer.Post(postsIds, options),
    ];

    for (const object of objects) {
        for await (const post of object.generator()) {
            result.push(post);
        }
    }   
    return result; 
}

    
const run = async () => {
    const result = await getResult();
    const json = JSON.stringify(result, null, 2);
    writeFileSync(getPath(), json, {
        encoding: "utf-8",
    });
}

run().catch(console.error);