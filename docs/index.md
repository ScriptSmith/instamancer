<video src="capture.webm" width="500px" autoplay loop></video>

<hr>

# About Instamancer

Instamancer is a scraping tool used in Instagram data mining and analysis projects.

Traditional Instagram scrapers either use a browser to access a web-page and read the DOM, or they manually reimplement the requests that browsers make to an API endpoint. This isn't ideal because:
 
1. Reading the DOM ignores some information that's only stored in memory.
2. Reimplementing requests requires the deciphering and reproduction of pagination and authentication mechanisms.
3. Both methods don't easily tolerate changes to the front and back end.

Instamancer is unique because it doesn't read the DOM or reimplement requests. Using [Puppeteer](https://github.com/GoogleChrome/puppeteer/) it interacts with Instagram.com, then intercepts and saves the responses to requests that the page's JavaScript initiates. This means that it can retrieve the full amount of information from the API while tolerating failed requests and rate limits, without having to reimplement client-side code. This makes it much better at withstanding regular changes to the interface and API.

As browsers become more and more like black boxes, this new scraping method will become increasingly relevant.

Instamancer also comes with some clever tricks:

- Because using a browser consumes lots of memory in large scraping jobs, Instamancer employs a new scraping technique called *grafting*. It intercepts and saves the URL and headers of each request, and then after a certain number of interactions with the page it will restart the browser and navigate back to the same page. Once the page initiates the first request to the API, its URL and headers are swapped on-the-fly with the most recently saved ones. The scraping continues without incident because the response from the API is in the correct form despite being for the incorrect data.
- Requests from pages for media and other non-API urls are intercepted and aborted to speed up scraping and conserve resources.
- Instagram sends limited information through its feed API. To get extra information like the location, tagged users, and comments, Instamancer can open new tabs for each post that it scrapes, and then read the metadata from memory.

# Installation

To get started with Instamancer, follow the installation instructions [here](https://github.com/ScriptSmith/instamancer#Install)

# Output

## Metadata

Instamancer outputs metadata into JSON and CSV files.

Here's a sample of output without `--full` mode:

```json
[
  {
    "node": {
      "comments_disabled": false,
      "__typename": "GraphImage",
      "id": "1953636359851103977",
      "edge_media_to_caption": {
        "edges": [
          {
            "node": {
              "text": "Love my #dogs"
            }
          }
        ]
      },
      "shortcode": "BsrrAClca9F",
      "edge_media_to_comment": {
        "count": 1
      },
      "taken_at_timestamp": 1547102918,
      "dimensions": {
        "height": 1350,
        "width": 1080
      },
      "display_url": "https://instagram.fbne3-1.fna.fbcdn.net/vp/5edccf8779ca7659a5ee7bb3e5bb0ec4/5CD38B5F/t51.2885-15/e35/49522041_130894740706474_725467490028727537_n.jpg?_nc_ht=instagram.fbne3-1.fna.fbcdn.net",
      "edge_liked_by": {
        "count": 3
      },
      "edge_media_preview_like": {
        "count": 3
      },
      "owner": {
        "id": "1838071775"
      },
      "thumbnail_src": "https://instagram.fbne3-1.fna.fbcdn.net/vp/5d074edce4bd1bdb02cadb670dd62571/5CBF791C/t51.2885-15/sh0.08/e35/c0.135.1080.1080/s640x640/49522041_130894740706474_725467490028727537_n.jpg?_nc_ht=instagram.fbne3-1.fna.fbcdn.net",
      "thumbnail_resources": [
        {
          "src": "https://instagram.fbne3-1.fna.fbcdn.net/vp/418024ac735200f61193e0de0bc2b79f/5CC9DD07/t51.2885-15/e35/c0.135.1080.1080/s150x150/49522041_130894740706474_725467490028727537_n.jpg?_nc_ht=instagram.fbne3-1.fna.fbcdn.net",
          "config_width": 150,
          "config_height": 150
        },
        {
          "src": "https://instagram.fbne3-1.fna.fbcdn.net/vp/ca0843efc1fa41da05f401d1d2d99c80/5CC6C84D/t51.2885-15/e35/c0.135.1080.1080/s240x240/49522041_130894740706474_725467490028727537_n.jpg?_nc_ht=instagram.fbne3-1.fna.fbcdn.net",
          "config_width": 240,
          "config_height": 240
        },
        {
          "src": "https://instagram.fbne3-1.fna.fbcdn.net/vp/5560c9aa0cbaf43d93b9f57da63f46ae/5CD068F7/t51.2885-15/e35/c0.135.1080.1080/s320x320/49522041_130894740706474_725467490028727537_n.jpg?_nc_ht=instagram.fbne3-1.fna.fbcdn.net",
          "config_width": 320,
          "config_height": 320
        },
        {
          "src": "https://instagram.fbne3-1.fna.fbcdn.net/vp/1842510041138b9f71cba3a7e7991f47/5CCEDFAD/t51.2885-15/e35/c0.135.1080.1080/s480x480/49522041_130894740706474_725467490028727537_n.jpg?_nc_ht=instagram.fbne3-1.fna.fbcdn.net",
          "config_width": 480,
          "config_height": 480
        },
        {
          "src": "https://instagram.fbne3-1.fna.fbcdn.net/vp/5d074edce4bd1bdb02cadb670dd62571/5CBF791C/t51.2885-15/sh0.08/e35/c0.135.1080.1080/s640x640/49522041_130894740706474_725467490028727537_n.jpg?_nc_ht=instagram.fbne3-1.fna.fbcdn.net",
          "config_width": 640,
          "config_height": 640
        }
      ],
      "is_video": false,
      "accessibility_caption": "Image may contain: 1 person, dog, outdoor, closeup, water and nature"
    }
  }
]
```

And with `--full` mode:

```json
[
  {
    "shortcode_media": {
      "__typename": "GraphImage",
      "id": "1958565413572638000",
      "shortcode": "BsHcdeHyEgY",
      "dimensions": {
        "height": 1349,
        "width": 1080
      },
      "gating_info": null,
      "media_preview": "ACEqQWKuuSmQWblCFPU8YPGPQc/WpoLWFSGRSpzwWJB7cH056eh9qvwlU3KeNrn8m+YfzxUMk8e4gfNn7wHT/wDXWd/IuwGMEkgsPXJ6H3zntR5Jzwcj04/nj/61EU6sflOT6Hr/APXHp3Hv0q0u05wMHuPShyt0CxT2D3/Sirm3/OKKXMPlM1sgEjq2B9akEIhXL/KfXGc/l/KoTcQHlWJOeBtPH/6qtI5ZQT0HXP8AP/69Uk3sK6RlzRuMMePccf59s81dUtcEGV9igAfLwT6kt2B9KDdI+VABx0yOPc89hWRK/mOxXkHpgZz/APWoa7iuafl2v/PWisjn+7RRYdyM8+/+f896lhmki+UHcB/CeR/n8cVWJI6U89BVElmS5aRQDg47AYHr+P0qMEkZ7UHq30/pSpSAb8vvRU2BRQM//9k=",
      "display_url": "https://instagram.fbne3-1.fna.fbcdn.net/vp/ff493b6b24e6e2be7df1ec9644d5339c/5CD16638/t51.2885-15/e35/49472607_1820670783526329_6546442839896910927_n.jpg?_nc_ht=instagram.fbne3-1.fna.fbcdn.net",
      "display_resources": [
        {
          "src": "https://instagram.fbne3-1.fna.fbcdn.net/vp/5150c80ce526c6f6bd4da78e4f57979f/5CBBD552/t51.2885-15/sh0.08/e35/p640x640/49472607_1820670783526329_6546442839896910927_n.jpg?_nc_ht=instagram.fbne3-1.fna.fbcdn.net",
          "config_width": 640,
          "config_height": 799
        },
        {
          "src": "https://instagram.fbne3-1.fna.fbcdn.net/vp/54585546542f3fae7f25ab23d219fd75/5CB87296/t51.2885-15/sh0.08/e35/p750x750/49472607_1820670783526329_6546442839896910927_n.jpg?_nc_ht=instagram.fbne3-1.fna.fbcdn.net",
          "config_width": 750,
          "config_height": 937
        },
        {
          "src": "https://instagram.fbne3-1.fna.fbcdn.net/vp/ff493b6b24e6e2be7df1ec9644d5339c/5CD16638/t51.2885-15/e35/49472607_1820670783526329_6546442839896910927_n.jpg?_nc_ht=instagram.fbne3-1.fna.fbcdn.net",
          "config_width": 1080,
          "config_height": 1349
        }
      ],
      "accessibility_caption": "Image may contain: dog",
      "is_video": false,
      "should_log_client_event": false,
      "tracking_token": "eyJ2ZXJzaW9uIjo1LCJwYXlsb2FkIjp7ImlzX2FdGGelBj5c190cmFjJa2VkIjpmYWxzZSwidXVpZCI6IjRlODVlYjAyYzdmYjRmMmViNWYwNzg1ODZlZjRhZTEwMTk1MzU2NDE4NDYzNTI2MzAwMCJ9LCJzaWduYXR1cmUiOiIifQ==",
      "edge_media_to_tagged_user": {
        "edges": []
      },
      "edge_media_to_caption": {
        "edges": [
          {
            "node": {
              "text": "Cool pic #dogs 👌🏻"
            }
          }
        ]
      },
      "caption_is_edited": false,
      "has_ranked_comments": false,
      "edge_media_to_comment": {
        "count": 0,
        "page_info": {
          "has_next_page": false,
          "end_cursor": null
        },
        "edges": []
      },
      "comments_disabled": false,
      "taken_at_timestamp": 1547103020,
      "edge_media_preview_like": {
        "count": 3,
        "edges": []
      },
      "edge_media_to_sponsor_user": {
        "edges": []
      },
      "location": null,
      "viewer_has_liked": false,
      "viewer_has_saved": false,
      "viewer_has_saved_to_collection": false,
      "viewer_in_photo_of_you": false,
      "viewer_can_reshare": true,
      "owner": {
        "id": "7050323018",
        "is_verified": false,
        "profile_pic_url": "https://instagram.fbne3-1.fna.fbcdn.net/vp/0859933bacb7ef085efcd513c7336f21/5CCBC50C/t51.2885-19/s150x150/47446882_612896971943840_3814256767933636272_n.jpg?_nc_ht=instagram.fbne3-1.fna.fbcdn.net",
        "username": "user.name",
        "blocked_by_viewer": false,
        "followed_by_viewer": false,
        "full_name": "Full name",
        "has_blocked_viewer": false,
        "is_private": false,
        "is_unpublished": false,
        "requested_by_viewer": false
      },
      "is_ad": false,
      "edge_web_media_to_related_media": {
        "edges": []
      }
    }
  }
]

```

## Media
To download media as well as scrape metadata, include the `-d` flag. By default, Instamancer downloads the highest-quality image available for each post.

By enabling full mode with `--full`, all images in albums are downloaded as well. 

Videos are downloaded when the `--video` flag is used along with `--full`.

The default download location for media is `downloads/[endpoint]/[id]`. This can be changed with the `--downdir` flag.
