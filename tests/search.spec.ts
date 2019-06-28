import * as Instamancer from "..";

test("Search Result Users", async () => {
  const result = await Instamancer.search("instagram", {});
  expect(result.users.length).toBeGreaterThan(0);
  expect(result.places.length).toBeGreaterThan(0);
  const user = result.users[0].user;
  expect(user.username).toBeTruthy();
  expect(user.byline).toBeTruthy();
  expect(user.profile_pic_url).toBeTruthy();
});


test("Search Result Hashtags", async () => {
  const result = await Instamancer.search("nofilter", {});
  expect(result.hashtags.length).toBeGreaterThan(0);
  const hashtag = result.hashtags[0].hashtag;
  expect(hashtag.media_count).not.toBeUndefined();
  expect(hashtag.name).toBeTruthy();
});

test("Search Result Places", async () => {
  const result = await Instamancer.search("newyork", {});
  expect(result.places.length).toBeGreaterThan(0);
  // TODO test places
});

