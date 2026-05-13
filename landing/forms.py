from django import forms


class ContactForm(forms.Form):
    name = forms.CharField(max_length=120)
    factory = forms.CharField(max_length=200)
    contact = forms.CharField(max_length=200)  # email or wechat handle
    product = forms.CharField(max_length=200, required=False)

    # Honeypot — real users won't fill this; bots usually do.
    website = forms.CharField(max_length=200, required=False)

    def is_spam(self) -> bool:
        return bool(self.cleaned_data.get("website"))
