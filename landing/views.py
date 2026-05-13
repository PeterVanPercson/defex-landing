from django.contrib import messages
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods

from .forms import ContactForm
from .notify import send, submission_email


def home(request):
    return render(request, "landing/home.html", {"form": ContactForm()})


@require_http_methods(["POST"])
def contact(request):
    form = ContactForm(request.POST)
    if form.is_valid() and not form.is_spam():
        subject, html = submission_email(form.cleaned_data, request)
        send(subject, html)
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
