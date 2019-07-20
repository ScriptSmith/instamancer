// tslint:disable: object-literal-sort-keys
import * as t from "io-ts";
import {excess} from "io-ts-excess";

export const ThumbnailResources = t.type({
  src: t.string,
  config_width: t.number,
  config_height: t.number,
});

export const Location = t.type({
  id: t.string,
  has_public_page: t.boolean,
  name: t.string,
  slug: t.string,
  address_json: t.union([t.string, t.undefined]),
});

export const PostNodeOwner = t.type({
  id: t.string,
});

export const CommentNodeOwner = t.type({
  id: t.string,
  is_verified: t.boolean,
  profile_pic_url: t.string,
  username: t.string,
});

export const ShortcodeMediaOwner = t.type({
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

export const EdgeMediaToCaptionNode = t.type({
  text: t.union([t.string, t.undefined]),
});

export const EdgeMediaToCaption = t.type({
  edges: t.array(
    t.type({
      node: EdgeMediaToCaptionNode,
    }),
  ),
});

export const EdgeMediaToComment = t.type({
  count: t.number,
});

export const PostNode = t.type({
  __typename: t.union([t.string, t.undefined]),
  comments_disabled: t.boolean,
  location: t.union([t.null, t.undefined, Location]),
  id: t.string,
  edge_media_to_caption: EdgeMediaToCaption,
  shortcode: t.string,
  edge_media_to_comment: EdgeMediaToComment,
  taken_at_timestamp: t.number,
  dimensions: Dimensions,
  display_url: t.string,
  edge_liked_by: t.union([EdgeMediaToComment, t.undefined]),
  edge_media_preview_like: EdgeMediaToComment,
  owner: PostNodeOwner,
  thumbnail_src: t.string,
  thumbnail_resources: t.array(ThumbnailResources),
  is_video: t.boolean,
  accessibility_caption: t.union([t.string, t.undefined, t.null]),
  video_view_count: t.union([t.undefined, t.number]),
  display_resources: t.union([
    t.array(
      t.type({
        src: t.string,
        config_width: t.number,
        config_height: t.number,
      }),
    ),
    t.undefined,
  ]),
  should_log_client_event: t.union([t.undefined, t.boolean]),
  tracking_token: t.union([t.undefined, t.string]),
  edge_media_to_tagged_user: t.union([t.undefined, EdgeMediaToCaption]),
  edge_media_to_sponsor_user: t.union([t.undefined, EdgeMediaToCaption]),
  dash_info: t.union([
    t.undefined,
    t.type({
      is_dash_eligible: t.boolean,
      video_dash_manifest: t.null,
      number_of_qualities: t.number,
    }),
  ]),
  video_url: t.union([t.undefined, t.string]),
  gating_info: t.union([t.null, t.undefined]),
  media_preview: t.union([t.undefined, t.string]),
  viewer_has_liked: t.union([t.undefined, t.boolean]),
  viewer_has_saved: t.union([t.boolean, t.undefined]),
  viewer_has_saved_to_collection: t.union([t.boolean, t.undefined]),
  viewer_in_photo_of_you: t.union([t.boolean, t.undefined]),
  viewer_can_reshare: t.union([t.boolean, t.undefined]),
});

export const CommentNode = t.type({
  id: t.string,
  text: t.string,
  created_at: t.number,
  did_report_as_spam: t.boolean,
  owner: CommentNodeOwner,
  viewer_has_liked: t.boolean,
  edge_liked_by: EdgeMediaToComment,
});

export const EdgeMediaPreviewComment = t.type({
  count: t.number,
  edges: t.array(
    t.type({
      node: CommentNode,
    }),
  ),
});

const EdgeMediaToParentCommentNode = t.intersection([
  CommentNode,
  t.type({
    edge_threaded_comments: t.type({
      count: t.number,
      page_info: PageInfo,
      edges: t.array(
        t.type({
          node: CommentNode,
        }),
      ),
    }),
  }),
]);

export const Post = t.type({
  node: excess(PostNode),
});

export const EdgeMediaToParentComment = t.type({
  count: t.number,
  page_info: PageInfo,
  edges: t.array(
    t.type({
      node: EdgeMediaToParentCommentNode,
    }),
  ),
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
  edge_media_to_parent_comment: t.union([
    EdgeMediaToParentComment,
    t.undefined,
  ]),
  edge_media_preview_comment: t.union([EdgeMediaPreviewComment, t.undefined]),
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
  owner: ShortcodeMediaOwner,
  is_ad: t.boolean,
  edge_web_media_to_related_media: EdgeMediaToCaption,
});

export const SinglePost = t.type({
  shortcode_media: ShortcodeMedia,
});

export const FullApiPost = t.type({
  shortcode_media: t.type({
    ...ShortcodeMedia.props,
    location: t.union([Location, t.null]),
  }),
});

// tslint:enable: object-literal-sort-keys

export type TPost = t.TypeOf<typeof Post>;

export type TSinglePost = t.TypeOf<typeof SinglePost>;

export type TFullApiPost = t.TypeOf<typeof FullApiPost>;
