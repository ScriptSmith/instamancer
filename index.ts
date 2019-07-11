import {Hashtag, IOptions, Location, Post, User} from "./src/api/api";

export {Hashtag, Location, Post, User, IOptions} from "./src/api/api";

export {TPost, TSinglePost} from "./src/api/types";

export function hashtag(id, options: IOptions) {
  return new Hashtag(id, options).generator();
}

export function location(id, options: IOptions) {
  return new Location(id, options).generator();
}

export function user(id, options: IOptions) {
  return new User(id, options).generator();
}

export function post(ids, options: IOptions) {
  return new Post(ids, options).generator();
}
