from django.conf import settings


def asset_version(request):
    return {"asset_v": settings.DEFEX_ASSET_VERSION,
            "booking_url": settings.BOOKING_URL,
            "cal_link": settings.CAL_LINK,
            "booking_embed_url": settings.BOOKING_EMBED_URL}
