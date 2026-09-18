from django.urls import path

from .discovery import company, company_json, robots, sitemap
from .feeds import BlogFeed
from .views import apply, blog, blog_post, book, careers, contact, home, ping, where_it_started

urlpatterns = [
    path('', home, name='home'),
    path('company/', company, name='company'),
    path('company.json', company_json, name='company_json'),
    path('where-it-started/', where_it_started, name='where_it_started'),
    path('book/', book, name='book'),
    path('careers/', careers, name='careers'),
    path('blog/', blog, name='blog'),
    path('blog/feed.xml', BlogFeed(), name='blog_feed'),
    path('blog/<slug:slug>/', blog_post, name='blog_post'),
    path('careers/apply/', apply, name='apply'),
    path('contact/', contact, name='contact'),
    path('ping/', ping, name='ping'),
    path('robots.txt', robots, name='robots'),
    path('sitemap.xml', sitemap, name='sitemap'),
]
