import * as Instamancer from "..";
import winston = require("winston");

jest.setTimeout(1000 * 20);

const instamancerOptions = {
  silent: true,
  headless: true,
  logger: winston.createLogger()
}

test("Search Result Users", async () => {
  const result = await Instamancer.search("instagram", instamancerOptions);
  expect(result.users.length).toBeGreaterThan(0);
  const user = result.users[0].user;
  expect(user.username).toBeTruthy();
  expect(user.byline).toBeTruthy();
  expect(user.profile_pic_url).toBeTruthy();
});


test("Search Result Hashtags", async () => {
  const result = await Instamancer.search("nofilter", instamancerOptions);
  expect(result.hashtags.length).toBeGreaterThan(0);
  const hashtag = result.hashtags[0].hashtag;
  expect(hashtag.media_count).not.toBeUndefined();
  expect(hashtag.name).toBeTruthy();
});

test("Search Result Places", async () => {
  const result = await Instamancer.search("New york", {
    silent: true,
  });
  expect(result.places.length).toBeGreaterThan(0);
  const place = result.places[0].place;
  expect(place.title).toBeTruthy();
});

