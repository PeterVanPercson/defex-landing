"""Public company facts and canonical crawl surfaces. No private fundraising data."""
import json
import os
from datetime import date
from xml.etree.ElementTree import Element, SubElement, tostring

from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.templatetags.static import static
from django.urls import reverse
from django.views.decorators.http import require_safe

CANONICAL_ORIGIN = "https://defexrobotics.com"
COMPANY_UPDATED = date(2026, 9, 17)
PUBLIC_COMPANY = {
    "name": "Defex",
    "alternate_name": "Defex Robotics",
    "url": CANONICAL_ORIGIN + "/",
    "description": "Defex is developing self-teaching assembly robots for manufacturing, starting with connector assembly.",
    "location": "San Francisco, California, United States",
    "as_of": COMPANY_UPDATED.isoformat(),
    "product": {
        "focus": "Connector assembly",
        "stage": "Assembly cell in development",
        "approach": "A robot attempts an assembly, a physical test scores the result, and a reset prepares the next attempt.",
        "prior_product": "Vision inspection prototype built on NVIDIA Jetson Orin",
    },
    "paid_waitlist": {
        "factories": 21,
        "definition": "Factories that paid to hold a place before the first assembly cell ships.",
        "as_of": COMPANY_UPDATED.isoformat(),
    },
    "founders": [
        {"name": "Husan Mavlonov", "role": "Co-founder and CEO", "id": "https://husanmavlonov.com/#person", "url": "https://husanmavlonov.com/", "bio": "Hardware researcher with more than three years in electronics manufacturing and batteries, with factory operations experience across Uzbekistan, Turkiye, China and the United States."},
        {"name": "Hasan Mavlonov", "role": "Co-founder and CTO", "id": CANONICAL_ORIGIN + "/company/#hasan-mavlonov", "bio": "Building a personality layer for AI, after publishing more than 10 research papers on it. Built an AI question-generation pipeline for a government education platform with more than 60,000 students."},
    ],
    "contact": "husan@defexrobotics.com",
    "links": {
        "company": CANONICAL_ORIGIN + "/company/",
        "technical_note": CANONICAL_ORIGIN + "/blog/the-cost-of-the-next-attempt/",
        "inspection_demo": CANONICAL_ORIGIN + "/#origin",
        "blog": CANONICAL_ORIGIN + "/blog/",
        "feed": CANONICAL_ORIGIN + "/blog/feed.xml",
    },
}


def organization_jsonld():
    """Keep the company distinct from its founders. No invented corporate profiles."""
    org_id = CANONICAL_ORIGIN + "/#org"
    graph = [
        {"@type": "Organization", "@id": org_id, "name": PUBLIC_COMPANY["name"],
         "alternateName": [PUBLIC_COMPANY["alternate_name"], "defex"],
         "url": PUBLIC_COMPANY["url"], "description": PUBLIC_COMPANY["description"],
         "logo": {"@type": "ImageObject", "url": CANONICAL_ORIGIN + static("img/apple-touch-icon.png"), "width": 180, "height": 180},
         "email": PUBLIC_COMPANY["contact"],
         "founder": [{"@id": person["id"]} for person in PUBLIC_COMPANY["founders"]],
         "location": {"@type": "Place", "name": PUBLIC_COMPANY["location"]}},
        {"@type": "WebSite", "@id": CANONICAL_ORIGIN + "/#website", "url": PUBLIC_COMPANY["url"],
         "name": "Defex", "alternateName": "Defex Robotics", "inLanguage": "en", "publisher": {"@id": org_id}},
    ]
    for person in PUBLIC_COMPANY["founders"]:
        node = {"@type": "Person", "@id": person["id"], "name": person["name"],
                "jobTitle": person["role"], "worksFor": {"@id": org_id}}
        if person.get("url"):
            node["url"] = person["url"]
            node["sameAs"] = ["https://www.linkedin.com/in/husan-mavlonov", "https://github.com/PeterVanPercson", "https://x.com/MavlonovHusan"]
        graph.append(node)
    # Only trusted public constants enter this graph. Escape HTML delimiters even
    # so: JSON in a script element must not be able to terminate the element.
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=True, indent=2).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


@require_safe
def company(request):
    return render(request, "landing/company.html", {"company": PUBLIC_COMPANY, "updated": COMPANY_UPDATED})


@require_safe
def investors(request):
    return render(request, "landing/investors.html", {"company": PUBLIC_COMPANY, "updated": COMPANY_UPDATED})


# The practice field on /why-us/: 36 attempts, the misses thinning out as a
# candidate improves. Illustrative only; the page labels the figure a schematic.
PRACTICE = "..x.x..x.xx." "x.xx.xxx.xxx" "xxxx.xxxxxxx"


@require_safe
def why_us(request):
    return render(request, "landing/why_us.html", {
        "company": PUBLIC_COMPANY, "updated": COMPANY_UPDATED,
        "practice_marks": [mark == "x" for mark in PRACTICE], "trials": range(8)})


@require_safe
def company_json(request):
    response = JsonResponse(PUBLIC_COMPANY, json_dumps_params={"indent": 2})
    response["X-Robots-Tag"] = "noindex"
    revision = os.environ.get("VERCEL_GIT_COMMIT_SHA", "")
    if revision:
        response["X-Defex-Revision"] = revision
    response["Link"] = '<' + CANONICAL_ORIGIN + '/company/>; rel="canonical"'
    return response


@require_safe
def llms_txt(request):
    from .views import POSTS

    husan, hasan = PUBLIC_COMPANY["founders"]
    lines = [
        "# Defex", "",
        "> " + PUBLIC_COMPANY["description"], "",
        "Defex (also written Defex Robotics) is based in " + PUBLIC_COMPANY["location"] + ". "
        + husan["name"] + " is " + husan["role"] + "; " + hasan["name"] + " is " + hasan["role"] + ". "
        "Canonical domain: defexrobotics.com (defex.app redirects here).", "",
        "## Company",
        "- [Company facts](" + PUBLIC_COMPANY["links"]["company"] + "): product stage, paid waitlist, founders, contact",
        "- [Home](" + PUBLIC_COMPANY["url"] + "): what the robots do and the inspection prototype",
        "- [Why us](" + CANONICAL_ORIGIN + reverse("why_us") + "): why robots that test every part they build: built-in testing, self-reset, new parts, and where we are today",
        "- [Investors](" + CANONICAL_ORIGIN + reverse("investors") + "): the pre-seed round and how to reach us",
        "- [Careers](" + CANONICAL_ORIGIN + reverse("careers") + "): open roles", "",
        "## Writing",
    ]
    for post in POSTS:
        path = reverse("blog_post", kwargs={"slug": post["slug"]})
        if post.get("canonical_url", CANONICAL_ORIGIN + path) == CANONICAL_ORIGIN + path:
            lines.append("- [" + post["title"] + "](" + CANONICAL_ORIGIN + path + ")")
    lines += ["- [Feed](" + PUBLIC_COMPANY["links"]["feed"] + ")", "",
              "## Contact", "- " + PUBLIC_COMPANY["contact"], ""]
    return HttpResponse("\n".join(lines), content_type="text/plain; charset=utf-8")


@require_safe
def robots(request):
    # Named crawler groups must repeat exclusions: they do not inherit the '*'
    # group. Existing public-page access, including training policy, is unchanged.
    rules = "Disallow: /contact/\nDisallow: /careers/apply/\nDisallow: /ping/\nDisallow: /admin/\nAllow: /\n"
    agents = ("*", "Googlebot", "Bingbot", "YandexBot", "OAI-SearchBot", "ChatGPT-User")
    body = "\n".join("User-agent: " + agent + "\n" + rules for agent in agents)
    body += "\nSitemap: " + CANONICAL_ORIGIN + "/sitemap.xml\n"
    return HttpResponse(body, content_type="text/plain; charset=utf-8")


@require_safe
def sitemap(request):
    # Import here to avoid a views/context-processor import cycle.
    from .views import POSTS

    # Do not manufacture lastmod=date.today(). Omit unknown modification dates.
    pages = [(reverse("home"), None), (reverse("careers"), None),
             (reverse("blog"), None), (reverse("company"), COMPANY_UPDATED),
             (reverse("investors"), COMPANY_UPDATED), (reverse("why_us"), None)]
    for post in POSTS:
        path = reverse("blog_post", kwargs={"slug": post["slug"]})
        canonical = post.get("canonical_url", CANONICAL_ORIGIN + path)
        if canonical == CANONICAL_ORIGIN + path:
            pages.append((path, post.get("modified", post["date"])))
    root = Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for path, modified in pages:
        entry = SubElement(root, "url")
        SubElement(entry, "loc").text = CANONICAL_ORIGIN + path
        if modified is not None:
            SubElement(entry, "lastmod").text = modified.isoformat()
    return HttpResponse(tostring(root, encoding="utf-8", xml_declaration=True), content_type="application/xml; charset=utf-8")
