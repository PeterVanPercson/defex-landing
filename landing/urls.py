from django.urls import path

from .views import contact, home, ping, pricing

urlpatterns = [
    path('', home, name='home'),
    path('contact/', contact, name='contact'),
    path('pricing/', pricing, name='pricing'),
    path('ping/', ping, name='ping'),
]
