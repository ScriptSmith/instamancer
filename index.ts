import {createApi} from "./src/api/api";

export {
  Hashtag,
  Location,
  Post,
  User,
  IOptions,
  createApi,
  IOptionsCommon,
  IOptionsFullApi,
  IOptionsRegular,
} from "./src/api/api";

export {TPost, TSinglePost, TFullApiPost} from "./src/api/types";

export function hashtag(id, options) {
  return createApi("hashtag", id, options).generator();
}

export function location(id, options) {
  return createApi("location", id, options).generator();
}

export function user(id, options) {
  return createApi("user", id, options).generator();
}

export function post(ids, options) {
  return createApi("post", ids, options).generator();
}
