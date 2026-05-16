import re

from django.conf import settings
from django.contrib import messages
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods

from .forms import ContactForm
from .notify import autoresponder_email, send, send_to, submission_email

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def home(request):
    return render(request, "landing/home.html", {"form": ContactForm()})


def pricing(request):
    return render(request, "landing/pricing.html")


@require_http_methods(["POST"])
def contact(request):
    form = ContactForm(request.POST)
    if form.is_valid() and not form.is_spam():
        data = form.cleaned_data
        # Admin notification → NOTIFY_TO (safe: only ever emails the owner).
        subject, html = submission_email(data, request)
        send(subject, html)
        # Autoresponder → the address the visitor typed. This emails an
        # arbitrary third party, so it's the spam-amplification surface.
        # AUTORESPONDER=0 in the env kills it instantly with no redeploy —
        # flip it the moment abuse shows up, until a captcha is wired.
        contact_field = (data.get("contact") or "").strip()
        if settings.AUTORESPONDER and EMAIL_RE.match(contact_field):
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
