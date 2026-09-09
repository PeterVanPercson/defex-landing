from django.urls import path

from .views import apply, careers, contact, home, ping, robots, sitemap, where_it_started

urlpatterns = [
    path('', home, name='home'),
    path('where-it-started/', where_it_started, name='where_it_started'),
    path('careers/', careers, name='careers'),
    path('careers/apply/', apply, name='apply'),
    path('contact/', contact, name='contact'),
    path('ping/', ping, name='ping'),
    path('robots.txt', robots, name='robots'),
    path('sitemap.xml', sitemap, name='sitemap'),
]
