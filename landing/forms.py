import re

from django import forms

from .jobs import ROLE_CHOICES

# The honeypot misses bots that fill only visible fields. The 2026-09-21 one
# sold "Google Search Index" listings from search-defexrobotics.com.
SEO_PITCH = re.compile(
    r"search[\s-]*index|google'?s? search|search results|search engine|\bseo\b|"
    r"backlinks?|rank(ing)? (higher|first|#?1)|searchindex|submit your (site|website)",
    re.I,
)
LOOKALIKE = re.compile(r"[\w.-]*defex[\w-]*\.[a-z]{2,}", re.I)
OWN_DOMAINS = {"defexrobotics.com", "www.defexrobotics.com", "defex.app"}


def looks_like_pitch(*fields: str) -> bool:
    text = " ".join(f or "" for f in fields)
    if SEO_PITCH.search(text):
        return True
    for m in LOOKALIKE.finditer(text):
        domain = m.group(0).lower().split("@")[-1]
        if domain not in OWN_DOMAINS:
            return True
    return False


class ContactForm(forms.Form):
    OPTIONS = (("part", "Send my part (free)"), ("place", "Hold my place ($1,000)"),
               ("bench", "Put my part on your bench ($5,000)"))

    name = forms.CharField(max_length=120)
    factory = forms.CharField(max_length=200)
    contact = forms.CharField(max_length=200)  # email or wechat handle
    # 200 was not enough to describe a connector, its failure mode and the
    # current process, which is exactly what makes an enquiry worth reading.
    product = forms.CharField(max_length=1200, required=False)
    option = forms.ChoiceField(choices=(("", "Not sure yet"),) + OPTIONS, required=False)

    # Honeypot — real users won't fill this; bots usually do.
    website = forms.CharField(max_length=200, required=False)

    def is_spam(self) -> bool:
        d = self.cleaned_data
        return bool(d.get("website")) or looks_like_pitch(
            d.get("name"), d.get("factory"), d.get("contact"), d.get("product"))


class ApplicationForm(forms.Form):
    """Careers application. There is no file field on purpose: this runs
    serverless on Vercel with no writable disk and no object store, so a
    resume upload would have nowhere to land. Links carry the same evidence."""

    ROLES = ROLE_CHOICES

    name = forms.CharField(max_length=120)
    email = forms.EmailField(max_length=200)
    role = forms.ChoiceField(choices=ROLES)
    work = forms.URLField(max_length=500, required=False)
    profile = forms.URLField(max_length=500, required=False)
    note = forms.CharField(max_length=1800, required=False)

    website = forms.CharField(max_length=200, required=False)   # honeypot

    def clean(self):
        data = super().clean()
        if not data.get("work") and len(data.get("note", "")) < 40:
            self.add_error("note", "Add a project link or describe your work below (at least 40 characters).")
        return data

    def is_spam(self) -> bool:
        return bool(self.cleaned_data.get("website"))
