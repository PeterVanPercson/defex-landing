from django.shortcuts import render


def home(request):
    return render(request, "landing/home.html")


def axis_home(request):
    return render(request, "axis/index.html")


def axis_landing(request):
    return render(request, "axis/landing-page.html")


def axis_observer(request):
    return render(request, "axis/the-observer.html")
