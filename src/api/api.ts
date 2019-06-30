import * as winston from "winston";
import {Instagram} from "./instagram";

/**
 * Returned as post entity on generator method
 */
export interface IPost {
    node?: IPostNode;
    shortcode_media?: {
        __typename: Typename;
        id: string;
        shortcode: string;
        dimensions: IDimensions;
        gating_info: null;
        media_preview: null | string;
        display_url: string;
        display_resources: IResource[];
        accessibility_caption?: string;
        is_video: boolean;
        should_log_client_event: boolean;
        tracking_token: string;
        edge_media_to_tagged_user: {
            edges: Array<{
                node: {
                    user: IUserClass;
                    x: number;
                    y: number;
                };
            }>;
        };
        edge_media_to_caption: IEdge;
        caption_is_edited: boolean;
        has_ranked_comments: boolean;
        edge_media_to_comment: IEdgeMediaToComment;
        comments_disabled: boolean;
        taken_at_timestamp: number;
        edge_media_preview_like: IEdgeMediaPreviewLike;
        edge_media_to_sponsor_user: IEdge;
        location: null;
        viewer_has_liked: boolean;
        viewer_has_saved: boolean;
        viewer_has_saved_to_collection: boolean;
        viewer_in_photo_of_you: boolean;
        viewer_can_reshare: boolean;
        owner: {
            id: string;
            is_verified: boolean;
            profile_pic_url: string;
            username: string;
            blocked_by_viewer: boolean;
            followed_by_viewer: boolean;
            full_name: string;
            has_blocked_viewer: boolean;
            is_private: boolean;
            is_unpublished: boolean;
            requested_by_viewer: boolean;
        };
        is_ad: boolean;
        edge_web_media_to_related_media: IEdge;
        edge_sidecar_to_children?: {
            edges: Array<{
                node: {
                    __typename: Typename;
                    id: string;
                    shortcode: string;
                    dimensions: IDimensions;
                    gating_info: null;
                    media_preview: null | string;
                    display_url: string;
                    display_resources: IResource[];
                    accessibility_caption: string;
                    is_video: boolean;
                    should_log_client_event: boolean;
                    tracking_token: string;
                    edge_media_to_tagged_user: IEdge;
                };
            }>;
        };
    };
}

/**
 * Optional arguments for the API
 */
export interface IOptions {
    // Total posts to download. 0 for unlimited
    total?: number;

    // Run Chrome in headless mode
    headless?: boolean;

    // Logging events
    logger?: winston.Logger;

    // Run without output to stdout
    silent?: boolean;

    // Time to sleep between interactions with the page
    sleepTime?: number;

    // Time to sleep when rate-limited
    hibernationTime?: number;

    // Enable the grafting process
    enableGrafting?: boolean;

    // Extract the full amount of information from the API
    fullAPI?: boolean;

    // Use a proxy in Chrome to connect to Instagram
    proxyURL?: string;

    // Location of the chromium / chrome binary executable
    executablePath?: string;
}

/**
 * An Instagram post API wrapper
 */
export class Post extends Instagram {
    // Post ids
    private readonly ids: string[];

    constructor(ids: string[], options: IOptions = {}) {
        super("https://instagram.com/p/", ids[0], "", "", options);
        this.ids = ids;
    }

    /**
     * Get the post metadata
     */
    protected async getNext() {
        for (const id of this.ids) {
            this.id = id;
            await this.postPage(id, 1);
            await this.sleep(1);
        }
        this.finished = true;
    }
}

/**
 * An Instagram hashtag API wrapper
 */
export class Hashtag extends Instagram {
    constructor(id: string, options: IOptions = {}) {
        const endpoint = "https://instagram.com/explore/tags/";
        const pageQuery = "data.hashtag.edge_hashtag_to_media.page_info";
        const edgeQuery = "data.hashtag.edge_hashtag_to_media.edges";
        super(endpoint, id, pageQuery, edgeQuery, options);
    }
}

/**
 * An Instagram location API wrapper
 */
export class Location extends Instagram {
    constructor(id: string, options: IOptions = {}) {
        const endpoint = "https://instagram.com/explore/locations/";
        const pageQuery = "data.location.edge_location_to_media.page_info";
        const edgeQuery = "data.location.edge_location_to_media.edges";
        super(endpoint, id, pageQuery, edgeQuery, options);
    }
}

/**
 * An Instagram user API wrapper
 */
export class User extends Instagram {
    constructor(id: string, options: IOptions = {}) {
        const endpoint = "https://instagram.com/";
        const pageQuery = "data.user.edge_owner_to_timeline_media.page_info";
        const edgeQuery = "data.user.edge_owner_to_timeline_media.edges";
        super(endpoint, id, pageQuery, edgeQuery, options);
    }
}

export interface IPostNode {
    comments_disabled: boolean;
    __typename?: Typename;
    id: string;
    edge_media_to_caption: IEdge;
    shortcode: string;
    edge_media_to_comment: IEdgeMediaToComment;
    taken_at_timestamp: number;
    dimensions: IDimensions;
    display_url: string;
    edge_liked_by?: IEdgeLikedBy;
    edge_media_preview_like: IEdgeMediaPreviewLike;
    owner: {
        id: string;
        username?: string;
    };
    thumbnail_src: string;
    thumbnail_resources: IResource[];
    is_video: boolean;
    accessibility_caption?: null | string;
    video_view_count?: number;
    display_resources?: IResource[];
    should_log_client_event?: boolean;
    tracking_token?: string;
    edge_media_to_tagged_user?: IEdge;
    edge_media_to_sponsor_user?: IEdge;
    gating_info?: null;
    media_preview?: string;
    location?: ILocation | null;
    viewer_has_liked?: boolean;
    viewer_has_saved?: boolean;
    viewer_has_saved_to_collection?: boolean;
    viewer_in_photo_of_you?: boolean;
    viewer_can_reshare?: boolean;
    dash_info?: {
        is_dash_eligible: boolean;
        video_dash_manifest: null;
        number_of_qualities: number;
    };
    video_url?: string;
}

export enum Typename {
    GraphImage = "GraphImage",
    GraphSidecar = "GraphSidecar",
    GraphVideo = "GraphVideo",
}

export interface IDimensions {
    height: number;
    width: number;
}

export interface IResource {
    src: string;
    config_width: number;
    config_height: number;
}

export interface IEdgeLikedBy {
    count: number;
}

export interface IEdgeMediaPreviewLike {
    count: number;
    edges?: any[];
}

export interface IEdge {
    edges: Array<{
        node: {
            text: string;
        };
    }>;
}

export interface IEdgeMediaToComment {
    count: number;
    page_info?: {
        has_next_page: boolean;
        end_cursor: null | string;
    };
    edges?: Array<{
        node: {
            id: string;
            text: string;
            created_at: number;
            did_report_as_spam: boolean;
            owner: IUserClass;
            viewer_has_liked: boolean;
            edge_liked_by?: IEdgeLikedBy;
        };
    }>;
}

export interface IUserClass {
    id: string;
    is_verified: boolean;
    profile_pic_url: string;
    username: string;
    full_name?: string;
}

export interface ILocation {
    id: string;
    has_public_page: boolean;
    name: string;
    slug: string;
}
