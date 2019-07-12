// tslint:disable: object-literal-sort-keys
import * as t from "io-ts";

export const ThumbnailResources = t.type({
  src: t.string,
  config_width: t.number,
  config_height: t.number,
});

export const Owner = t.type({
  id: t.string,
});

export const Owner1 = t.type({
  id: t.string,
  is_verified: t.boolean,
  profile_pic_url: t.string,
  username: t.string,
});

export const Owner2 = t.type({
  id: t.string,
  is_verified: t.boolean,
  profile_pic_url: t.string,
  username: t.string,
  blocked_by_viewer: t.boolean,
  followed_by_viewer: t.boolean,
  full_name: t.string,
  has_blocked_viewer: t.boolean,
  is_private: t.boolean,
  is_unpublished: t.boolean,
  requested_by_viewer: t.boolean,
});

export const PageInfo = t.type({
  has_next_page: t.boolean,
  end_cursor: t.union([t.string, t.null]),
});

export const Dimensions = t.type({
  height: t.number,
  width: t.number,
});

export const EdgeMediaPreviewComment = t.type({
  count: t.number,
  edges: t.UnknownArray,
});

export const Node1 = t.type({
  text: t.union([t.string, t.undefined]),
});

export const EdgeMediaToCaption = t.type({
  edges: t.array(
    t.type({
      node: Node1,
    }),
  ),
});

export const EdgeMediaToComment = t.type({
  count: t.number,
});

export const Node = t.type({
  comments_disabled: t.boolean,
  id: t.string,
  edge_media_to_caption: EdgeMediaToCaption,
  shortcode: t.string,
  edge_media_to_comment: EdgeMediaToComment,
  taken_at_timestamp: t.number,
  dimensions: Dimensions,
  display_url: t.string,
  edge_liked_by: EdgeMediaToComment,
  edge_media_preview_like: EdgeMediaToComment,
  owner: Owner,
  thumbnail_src: t.string,
  thumbnail_resources: t.array(ThumbnailResources),
  is_video: t.boolean,
  accessibility_caption: t.union([t.string, t.undefined]),
});

export const Node3 = t.type({
  id: t.string,
  text: t.string,
  created_at: t.number,
  did_report_as_spam: t.boolean,
  owner: Owner1,
  viewer_has_liked: t.boolean,
  edge_liked_by: EdgeMediaToComment,
});

export const Post = t.type({
  node: Node,
});

export const EdgeMediaToParentComment = t.type({
  count: t.number,
  page_info: PageInfo,
  edges: t.UnknownArray, // TODO
});

export const ShortcodeMedia = t.type({
  __typename: t.string,
  id: t.string,
  shortcode: t.string,
  dimensions: Dimensions,
  gating_info: t.union([t.string, t.null]),
  media_preview: t.union([t.string, t.null]),
  display_url: t.string,
  display_resources: t.array(ThumbnailResources),
  accessibility_caption: t.union([t.string, t.undefined]),
  is_video: t.boolean,
  should_log_client_event: t.boolean,
  tracking_token: t.string,
  edge_media_to_tagged_user: EdgeMediaToCaption,
  edge_media_to_caption: EdgeMediaToCaption,
  caption_is_edited: t.boolean,
  has_ranked_comments: t.boolean,
  edge_media_to_parent_comment: EdgeMediaToParentComment,
  edge_media_preview_comment: EdgeMediaPreviewComment,
  comments_disabled: t.boolean,
  taken_at_timestamp: t.number,
  edge_media_preview_like: EdgeMediaPreviewComment,
  edge_media_to_sponsor_user: EdgeMediaToCaption,
  location: t.union([t.string, t.null]),
  viewer_has_liked: t.boolean,
  viewer_has_saved: t.boolean,
  viewer_has_saved_to_collection: t.boolean,
  viewer_in_photo_of_you: t.boolean,
  viewer_can_reshare: t.boolean,
  owner: Owner2,
  is_ad: t.boolean,
  edge_web_media_to_related_media: EdgeMediaToCaption,
});

export const SinglePost = t.type({
  shortcode_media: ShortcodeMedia,
});

// tslint:enable: object-literal-sort-keys

export type TPost = t.TypeOf<typeof Post>;

export type TSinglePost = t.TypeOf<typeof SinglePost>;
