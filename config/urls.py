from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path

# No /admin route: this is a static marketing site with no auth and no
# DB writes. Routing the admin only adds a brute-force target and 500s
# on a read-only serverless filesystem.
urlpatterns = [
    path('', include('landing.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
