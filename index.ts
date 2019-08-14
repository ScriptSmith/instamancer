import {createApi} from "./src/api/api";

export {
  Hashtag,
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

export function user(id, options) {
  return createApi("user", id, options).generator();
}

export function post(ids, options) {
  return createApi("post", ids, options).generator();
}
