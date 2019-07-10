import * as t from "io-ts";
import {IOptions} from "../../src/api/api";
import {Instagram} from "../../src/api/instagram";

const FakeValidator = t.type({
  bar: t.number,
  foo: t.string,
});

export class ValidationsFailingInstagram extends Instagram<
  t.TypeOf<typeof FakeValidator>
> {
  constructor(id: string, options: IOptions = {}) {
    const endpoint = "https://instagram.com/explore/tags/";
    const pageQuery = "data.hashtag.edge_hashtag_to_media.page_info";
    const edgeQuery = "data.hashtag.edge_hashtag_to_media.edges";
    super(endpoint, id, pageQuery, edgeQuery, options, FakeValidator);
  }
}
