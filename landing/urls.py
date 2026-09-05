from django.urls import path

from .views import contact, home, ping, pricing
from .review_views import quality_review, review_analyze, review_generate, review_sample

urlpatterns = [
    path('', home, name='home'),
    path('contact/', contact, name='contact'),
    path('pricing/', pricing, name='pricing'),
    path('ping/', ping, name='ping'),
    path('quality-review/', quality_review, name='quality_review'),
    path('quality-review/analyze/', review_analyze, name='review_analyze'),
    path('quality-review/generate/', review_generate, name='review_generate'),
    path('quality-review/sample/<slug:sample_id>/', review_sample, name='review_sample'),
]
