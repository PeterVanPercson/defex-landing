from datetime import datetime, time, timezone

from django.contrib.syndication.views import Feed
from django.urls import reverse
from django.utils.feedgenerator import Rss201rev2Feed

from .views import POSTS


class BlogFeed(Feed):
    """/blog/feed.xml, built from the same POSTS registry as the index and the
    sitemap, so a post is in the feed the moment it is published."""
    feed_type = Rss201rev2Feed
    title = "Defex blog"
    link = "/blog/"
    description = "Notes and selected reading on physical AI, robot learning, manufacturing, and AI hardware."

    def items(self):
        return POSTS

    def item_title(self, post):
        return post["title"]

    def item_description(self, post):
        return post["dek"]

    def item_link(self, post):
        return reverse("blog_post", kwargs={"slug": post["slug"]})

    def item_pubdate(self, post):
        return datetime.combine(post["date"], time(9, 0), tzinfo=timezone.utc)

    def item_author_name(self, post):
        return post["author"]["name"]

    def item_author_link(self, post):
        return post["author"]["url"]
