from django.conf import settings
from django.utils.encoding import iri_to_uri

from .discovery import CANONICAL_ORIGIN, organization_jsonld


def asset_version(request):
    return {"asset_v": settings.DEFEX_ASSET_VERSION,
            "cal_link": settings.CAL_LINK,
            "web_analytics": settings.WEB_ANALYTICS,
            "canonical_url": CANONICAL_ORIGIN + iri_to_uri(request.path),
            "organization_jsonld": organization_jsonld()}
