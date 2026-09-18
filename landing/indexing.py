"""IndexNow ownership proof. The root key response is public by protocol."""
import hashlib
import hmac

from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.http import require_safe


@require_safe
def indexnow_key(request):
    # Domain-separated HMAC avoids committing a key or disclosing SECRET_KEY.
    key = hmac.new(settings.SECRET_KEY.encode("utf-8"),
                   b"defexrobotics.com:indexnow:v1", hashlib.sha256).hexdigest()
    response = HttpResponse(key, content_type="text/plain; charset=utf-8")
    response["X-Robots-Tag"] = "noindex"
    response["Cache-Control"] = "public, max-age=300"
    return response
