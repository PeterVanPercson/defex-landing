from django.urls import path

from .discovery import company, company_json, investors, llms_txt, robots, sitemap, why_us
from .feeds import BlogFeed
from .indexing import indexnow_key
from .views import apply, blog, blog_post, book, careers, contact, home, ping, where_it_started

urlpatterns = [
    path('', home, name='home'),
    path('company/', company, name='company'),
    path('company.json', company_json, name='company_json'),
    path('investors/', investors, name='investors'),
    path('why-us/', why_us, name='why_us'),
    path('indexnow-key.txt', indexnow_key, name='indexnow_key'),
    path('where-it-started/', where_it_started, name='where_it_started'),
    path('book/', book, name='book'),
    path('careers/', careers, name='careers'),
    path('blog/', blog, name='blog'),
    path('blog/feed.xml', BlogFeed(), name='blog_feed'),
    path('blog/<slug:slug>/', blog_post, name='blog_post'),
    path('careers/apply/', apply, name='apply'),
    path('careers/<slug:slug>/', careers, name='career_detail'),
    path('contact/', contact, name='contact'),
    path('ping/', ping, name='ping'),
    path('llms.txt', llms_txt, name='llms_txt'),
    path('robots.txt', robots, name='robots'),
    path('sitemap.xml', sitemap, name='sitemap'),
]
