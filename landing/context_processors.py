from django.conf import settings


def asset_version(request):
    return {"asset_v": settings.DEFEX_ASSET_VERSION}
