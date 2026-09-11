from django import forms


class ContactForm(forms.Form):
    name = forms.CharField(max_length=120)
    factory = forms.CharField(max_length=200)
    contact = forms.CharField(max_length=200)  # email or wechat handle
    # 200 was not enough to describe a connector, its failure mode and the
    # current process, which is exactly what makes an enquiry worth reading.
    product = forms.CharField(max_length=1200, required=False)

    # Honeypot — real users won't fill this; bots usually do.
    website = forms.CharField(max_length=200, required=False)

    def is_spam(self) -> bool:
        return bool(self.cleaned_data.get("website"))


class ApplicationForm(forms.Form):
    """Careers application. There is no file field on purpose: this runs
    serverless on Vercel with no writable disk and no object store, so a
    resume upload would have nowhere to land. Links carry the same evidence."""

    ROLES = [("content-producer", "Content Producer")]

    name = forms.CharField(max_length=120)
    email = forms.EmailField(max_length=200)
    role = forms.ChoiceField(choices=ROLES)
    work = forms.URLField(max_length=500)          # the one strong example
    profile = forms.URLField(max_length=500, required=False)
    note = forms.CharField(max_length=600, required=False)

    website = forms.CharField(max_length=200, required=False)   # honeypot

    def is_spam(self) -> bool:
        return bool(self.cleaned_data.get("website"))
