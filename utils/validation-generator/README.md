# API validation generator

> Warning! The output which we get from `transform-json-types` library is not perfect. `output.ts` needs to be checked after the automatic transformation.

This util is used to automatically generate [io-ts](https://github.com/gcanti/io-ts) runtime and type validations for an actual Instagram API. 

To generate these validations two steps are required:

*   Get an actual Instagram API response and save as json
*   Get `io-ts` typings from it

## Actual API response

`ts-node utils/validation-generator/get-input.ts` 

The script will save an actual API response for different endpoints in `input.json` file (gitignored)

## Generate typings

> Warning! By some weird reasons these typings are a little bit screwed. Need to replace Node3 with Node inside Post type to make them ok.

1.  `ts-node utils/validation-generator/generate.ts` (The script will save typing to `output.ts` file.)
2.  Move all primitive types (which does not use other types, like `ThumbnailResources`, `Owner` and others) to the top of the file, final types (like `Post`) to the bottom of the file and fix all the block-scoped variables order errors manually.
3.  Write typing for FullApiPost (generally it is a SinglePost, but with location as an object)
4.  It is better to make the main type excessive by using [io-ts-excess](https://github.com/goooseman/io-ts-excess). Here's an example:
```typescript
export const SinglePost = t.type({
  shortcode_media: excess(ShortcodeMedia),
});
```
By make this type excessive, you will get validation error, if some new properties appeared in the API.
5.  Move `SearchResult`, `User`, `Places`, `Hashtags` types to `src/api/search.ts`
6.  Fix the rest of the typings

## Fix typings

To quickly find all the typing errors in the project, you can run `npm test -- -t "Strict mode"` and `npm test -- -t "Full API"`.

You can get a lot of really verbose errors, like:

``` typescript
    Invalid value 
    {"id":"219469050","has_public_page":true,"name":"Costa Nova, Aveiro, Portugal","slug":"costa-nova-aveiro-portugal","address_json":"{\"street_address\": \"\", \"zip_code\": \"\", \"city_name\": \"Costa Nova, Aveiro, Portugal\", \"region_name\": \"\", \"country_code\": \"PT\", \"exact_city_match\": true, \"exact_region_match\": false, \"exact_country_match\": false}"}
    supplied to : 
    { shortcode_media: { __typename: string, id: string, shortcode: string, dimensions: { height: number, width: number }, gating_info: (string | null), media_preview: (string | null), display_url: string, display_resources: Array<{ src: string, config_width: number, config_height: number }>, accessibility_caption: (string | undefined), is_video: boolean, should_log_client_event: boolean, tracking_token: string, edge_media_to_tagged_user: { edges: Array<{ node: { text: (string | undefined) } }> }, edge_media_to_caption: { edges: Array<{ node: { text: (string | undefined) } }> }, caption_is_edited: boolean, has_ranked_comments: boolean, edge_media_to_parent_comment: ({ count: number, page_info: { has_next_page: boolean, end_cursor: (string | null) }, edges: Array<{ node: ({ id: string, text: string, created_at: number, did_report_as_spam: boolean, owner: { id: string, is_verified: boolean, profile_pic_url: string, username: string }, viewer_has_liked: boolean, edge_liked_by: { count: number } } & { edge_threaded_comments: { count: number, page_info: { has_next_page: boolean, end_cursor: (string | null) }, edges: Array<{ node: { id: string, text: string, created_at: number, did_report_as_spam: boolean, owner: { id: string, is_verified: boolean, profile_pic_url: string, username: string }, viewer_has_liked: boolean, edge_liked_by: { count: number } } }> } }) }> } | undefined), edge_media_preview_comment: ({ count: number, edges: Array<{ node: { id: string, text: string, created_at: number, did_report_as_spam: boolean, owner: { id: string, is_verified: boolean, profile_pic_url: string, username: string }, viewer_has_liked: boolean, edge_liked_by: { count: number } } }> } | undefined), comments_disabled: boolean, taken_at_timestamp: number, edge_media_preview_like: { count: number, edges: Array<{ node: { id: string, text: string, created_at: number, did_report_as_spam: boolean, owner: { id: string, is_verified: boolean, profile_pic_url: string, username: string }, viewer_has_liked: boolean, edge_liked_by: { count: number } } }> }, edge_media_to_sponsor_user: { edges: Array<{ node: { text: (string | undefined) } }> }, location: (string | null), viewer_has_liked: boolean, viewer_has_saved: boolean, viewer_has_saved_to_collection: boolean, viewer_in_photo_of_you: boolean, viewer_can_reshare: boolean, owner: { id: string, is_verified: boolean, profile_pic_url: string, username: string, blocked_by_viewer: boolean, followed_by_viewer: boolean, full_name: string, has_blocked_viewer: boolean, is_private: boolean, is_unpublished: boolean, requested_by_viewer: boolean }, is_ad: boolean, edge_web_media_to_related_media: { edges: Array<{ node: { text: (string | undefined) } }> } } }
    /shortcode_media: { __typename: string, id: string, shortcode: string, dimensions: { height: number, width: number }, gating_info: (string | null), media_preview: (string | null), display_url: string, display_resources: Array<{ src: string, config_width: number, config_height: number }>, accessibility_caption: (string | undefined), is_video: boolean, should_log_client_event: boolean, tracking_token: string, edge_media_to_tagged_user: { edges: Array<{ node: { text: (string | undefined) } }> }, edge_media_to_caption: { edges: Array<{ node: { text: (string | undefined) } }> }, caption_is_edited: boolean, has_ranked_comments: boolean, edge_media_to_parent_comment: ({ count: number, page_info: { has_next_page: boolean, end_cursor: (string | null) }, edges: Array<{ node: ({ id: string, text: string, created_at: number, did_report_as_spam: boolean, owner: { id: string, is_verified: boolean, profile_pic_url: string, username: string }, viewer_has_liked: boolean, edge_liked_by: { count: number } } & { edge_threaded_comments: { count: number, page_info: { has_next_page: boolean, end_cursor: (string | null) }, edges: Array<{ node: { id: string, text: string, created_at: number, did_report_as_spam: boolean, owner: { id: string, is_verified: boolean, profile_pic_url: string, username: string }, viewer_has_liked: boolean, edge_liked_by: { count: number } } }> } }) }> } | undefined), edge_media_preview_comment: ({ count: number, edges: Array<{ node: { id: string, text: string, created_at: number, did_report_as_spam: boolean, owner: { id: string, is_verified: boolean, profile_pic_url: string, username: string }, viewer_has_liked: boolean, edge_liked_by: { count: number } } }> } | undefined), comments_disabled: boolean, taken_at_timestamp: number, edge_media_preview_like: { count: number, edges: Array<{ node: { id: string, text: string, created_at: number, did_report_as_spam: boolean, owner: { id: string, is_verified: boolean, profile_pic_url: string, username: string }, viewer_has_liked: boolean, edge_liked_by: { count: number } } }> }, edge_media_to_sponsor_user: { edges: Array<{ node: { text: (string | undefined) } }> }, location: (string | null), viewer_has_liked: boolean, viewer_has_saved: boolean, viewer_has_saved_to_collection: boolean, viewer_in_photo_of_you: boolean, viewer_can_reshare: boolean, owner: { id: string, is_verified: boolean, profile_pic_url: string, username: string, blocked_by_viewer: boolean, followed_by_viewer: boolean, full_name: string, has_blocked_viewer: boolean, is_private: boolean, is_unpublished: boolean, requested_by_viewer: boolean }, is_ad: boolean, edge_web_media_to_related_media: { edges: Array<{ node: { text: (string | undefined) } }> } }
    /location: (string | null)
    /1: null
```

This looks scary, but let's make it simple. We need just two parts from the output. 

The first one is the text representation of the value, which validator could not validate. It is between `Invalid value` and `supplied to` strings.
The second one is the type of value it has expected, and it can be found after last or one before last `/` sign.

In our case validator expected `string` or `null`, but an object has been recieved.

So we can fix the typing in the following way:

``` typescript
export const Location = t.type({
  id: t.string,
  has_public_page: t.boolean,
  name: t.string,
  slug: t.string,
  address_json: t.string,
});
...
 location: t.union([t.string, t.null, Location])

```
