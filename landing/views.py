import re

from django.contrib import messages
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods

from .forms import ContactForm
from .notify import autoresponder_email, send, send_to, submission_email

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def home(request):
    return render(request, "landing/home.html", {"form": ContactForm()})


@require_http_methods(["POST"])
def contact(request):
    form = ContactForm(request.POST)
    if form.is_valid() and not form.is_spam():
        data = form.cleaned_data
        # Admin notification → husan@buildcored.com (NOTIFY_TO)
        subject, html = submission_email(data, request)
        send(subject, html)
        # Personal autoresponder → submitter, FROM husan@buildcored.com
        contact_field = (data.get("contact") or "").strip()
        if EMAIL_RE.match(contact_field):
            a_subject, a_html = autoresponder_email(data.get("name", ""), data.get("factory", ""))
            send_to(
                contact_field,
                a_subject,
                a_html,
                from_addr="Husan Mavlonov <husan@buildcored.com>",
            )
        messages.success(request, "Got it — we'll reply within one working day.")
    else:
        messages.error(request, "Something looked off. Try again, or email us directly.")
    referer = request.META.get("HTTP_REFERER", "/")
    return redirect(referer.split("#")[0] + "#contact")


def axis_home(request):
    return render(request, "axis/index.html")


def axis_landing(request):
    return render(request, "axis/landing-page.html")


def axis_observer(request):
    return render(request, "axis/the-observer.html")
