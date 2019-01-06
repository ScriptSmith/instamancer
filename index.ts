// Export

import {Hashtag, IOptions, Location, User} from "./src/api";

export {Hashtag, Location, User, IOptions} from "./src/api";

export function hashtag(id, options: IOptions) {
    return new Hashtag(id, options).generator();
}

export function location(id, options: IOptions) {
    return new Location(id, options).generator();
}

export function user(id, options: IOptions) {
    return new User(id, options).generator();
}
