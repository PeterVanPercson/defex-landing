from django.urls import path

from .views import axis_home, axis_landing, axis_observer, home

urlpatterns = [
    path('', home, name='home'),
    path('axis/', axis_home, name='axis_home'),
    path('axis/landing-page/', axis_landing, name='axis_landing'),
    path('axis/the-observer/', axis_observer, name='axis_observer'),
]
