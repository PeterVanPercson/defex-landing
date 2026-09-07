from django.urls import path

from .views import contact, home, ping, where_it_started
from .review_views import quality_review, review_analyze, review_generate, review_sample

urlpatterns = [
    path('', home, name='home'),
    path('where-it-started/', where_it_started, name='where_it_started'),
    path('contact/', contact, name='contact'),
    path('ping/', ping, name='ping'),
    path('quality-review/', quality_review, name='quality_review'),
    path('quality-review/analyze/', review_analyze, name='review_analyze'),
    path('quality-review/generate/', review_generate, name='review_generate'),
    path('quality-review/sample/<slug:sample_id>/', review_sample, name='review_sample'),
]
